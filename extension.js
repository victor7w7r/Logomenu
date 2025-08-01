import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';

import * as Constants from './constants.js';
import * as Selection from './selection.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const MenuItem = GObject.registerClass(
class LogoMenuMenuItem extends PopupMenu.PopupMenuItem {
    _init(name, activateFunction) {
        super._init(name);
        this.connect('activate', () => activateFunction());
    }
});

const MenuButton = GObject.registerClass(
class LogoMenuMenuButton extends PanelMenu.Button {
    _init(extension) {
        super._init(0.5, 'LogoMenu');
        this._extension = extension;
        this._settings = extension.getSettings();

        // Icon
        this.icon = new St.Icon({
           style_class: 'menu-button',
        });
        
        this._settings.connectObject('changed::hide-icon-shadow', () => this.hideIconShadow(), this);
        this._settings.connectObject('changed::menu-button-icon-image', () => this.setIconImage(), this);
        this._settings.connectObject('changed::symbolic-icon', () => this.setIconImage(), this);
        this._settings.connectObject('changed::use-custom-icon', () => this.setIconImage(), this);
        this._settings.connectObject('changed::custom-icon-path', () => this.setIconImage(), this);
        this._settings.connectObject('changed::menu-button-icon-size', () => this.setIconSize(), this);
	
	this.hideIconShadow();
        this.setIconImage();
        this.setIconSize();
        this.add_child(this.icon);

        // Menu
        this._settings.connectObject('changed::hide-softwarecentre', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::hide-warehouse', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::show-power-options', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::show-gamemode', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::show-distroshelf', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::hide-forcequit', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::show-lockscreen', () => this._displayMenuItems(), this);
        this._settings.connectObject('changed::show-activities-button', () => this._displayMenuItems(), this);
        this._displayMenuItems();

        // bind middle click option to toggle overview
        this.connect('button-press-event', this._buttonPressEvent.bind(this));
    }

    _addItem(item) {
        this.menu.addMenuItem(item);
    }

    _displayMenuItems() {
        const showPowerOptions = this._settings.get_boolean('show-power-options');
        const showReturnToGamingMode = this._settings.get_boolean('show-gamemode');
        const showDistroShelf = this._settings.get_boolean('show-distroshelf');
        const showForceQuit = !this._settings.get_boolean('hide-forcequit');
        const showLockScreen = this._settings.get_boolean('show-lockscreen');
        const showSoftwareCenter = !this._settings.get_boolean('hide-softwarecentre');
        const showWarehouse = !this._settings.get_boolean('hide-warehouse');
        const showActivitiesButton = this._settings.get_boolean('show-activities-button');

        this.menu.removeAll();

        this._addItem(new MenuItem(_('Acerca de esta PC'), () => this._aboutThisDistro()));
        this._addItem(new PopupMenu.PopupSeparatorMenuItem());
        this._addItem(new MenuItem(_('Configuración del sistema...'), () => this._systemPreferences()));
        this._addItem(new MenuItem(_('Extension Manager'), () => this._openExtensionsApp()));
        this._addItem(new MenuItem(_('Gestión de software'), () => this._openOctopi()));

        if (showForceQuit) {
            this._addItem(new PopupMenu.PopupSeparatorMenuItem());
            this._addItem(new MenuItem(_('Forzar salida...'), () => this._forceQuit()));
            this._addItem(new MenuItem(_('Mission Center'), () => this._openSystemMonitor()));
        }

        if (showPowerOptions) {
            this._addItem(new PopupMenu.PopupSeparatorMenuItem());
            this._addItem(new MenuItem(_('Reposo'), () => this._sleep()));
            this._addItem(new MenuItem(_('Reiniciar...'), () => this._restart()));
            this._addItem(new MenuItem(_('Apagar...'), () => this._shutdown()));

            if (showLockScreen) {
                this._addItem(new PopupMenu.PopupSeparatorMenuItem());
                this._addItem(new MenuItem(_('Bloquear pantalla'), () => this._lockScreen()));
                this._addItem(new MenuItem(_('Cerrar sesión...'), () => this._logOut()));
            }
        }

    }

    _buttonPressEvent(actor, event) {
        // left click === 1, middle click === 2, right click === 3
        const clickType = this._settings.get_int('menu-button-icon-click-type');
        if (event.get_button() === clickType) {
            this.menu.close();
            Main.overview.toggle();
        }
    }

    _aboutThisDistro() {
        const gnomeMajorVersion = parseInt(Config.PACKAGE_VERSION.toString().split('.')[0]);
        if (gnomeMajorVersion >= 46) {
            Util.spawn(['gnome-control-center', 'system', 'about']);
        } else {
            Util.spawn(['gnome-control-center', 'info-overview']);
        }
    }

    _systemPreferences() {
        Util.spawn(['gnome-control-center']);
    }

    _overviewToggle() {
        Main.overview.toggle();
    }

    _sleep() {
        Util.spawn(['systemctl', 'suspend']);
    }

    _restart() {
        Util.spawn(['gnome-session-quit', '--reboot']);
    }

    _shutdown() {
        Util.spawn(['gnome-session-quit', '--power-off']);
    }

    _lockScreen() {
        Util.spawn(['loginctl', 'lock-session']);
    }

    _returnToGamingMode() {
        Util.spawn(['gnome-session-quit', '--logout', '--no-prompt']);
    }
	
    _logOut() {
        Util.spawn(['gnome-session-quit', '--logout']);
    }

    _showAppGrid() {
        // Code snippet from - https://github.com/G-dH/custom-hot-corners-extended/blob/gdh/actions.js
        // Pressing the apps btn before overview activation avoids icons animation in GS 3.36/3.38
        Main.overview.dash.showAppsButton.checked = true;
        // in 3.36 pressing the button is usualy enough to activate overview, but not always
        Main.overview.show();
    }

    _forceQuit() {
        new Selection.SelectionWindow();
    }

    _openNautilus() {
        Util.spawn(['nautilus']);
    }

    _openTerminal() {
        Util.trySpawnCommandLine(this._settings.get_string('menu-button-terminal'));
    }

    _openDistroShelf() {
        Util.trySpawnCommandLine('/usr/bin/distroshelf-helper');
    }

    _openSoftwareCenter() {
        Util.trySpawnCommandLine(this._settings.get_string('menu-button-software-center'));
    }

    _openWarehouse() {
        Util.trySpawnCommandLine('/usr/bin/warehouse-helper');
    }

    _openSteam() {
        Util.spawn(['switcherooctl', 'launch', 'bazzite-steam']);
    }

    _openLutris() {
        Util.spawn(['switcherooctl', 'launch', 'lutris']);
    }

    _openSystemMonitor() {
        Util.trySpawnCommandLine('/usr/bin/missioncenter');
    }

    _openOctopi() {
        Util.trySpawnCommandLine('/usr/bin/octopi');
    }

    _openExtensionsApp() {
      Util.trySpawnCommandLine('/usr/bin/extension-manager');
    }

    setIconImage() {
        const iconIndex = this._settings.get_int('menu-button-icon-image');
        const isSymbolic = this._settings.get_boolean('symbolic-icon');
        const useCustomIcon = this._settings.get_boolean('use-custom-icon');
        const customIconPath = this._settings.get_string('custom-icon-path');
        let isStartHereSymbolic = false;
        let iconPath;
        let notFound = false;

        if (useCustomIcon && customIconPath !== '') {
            iconPath = customIconPath;
        } else if (isSymbolic) {
            if (Constants.SymbolicDistroIcons[iconIndex] !== undefined) {
                isStartHereSymbolic = Constants.SymbolicDistroIcons[iconIndex].PATH === 'start-here-symbolic';
                iconPath = this._extension.path + Constants.SymbolicDistroIcons[iconIndex].PATH;
            } else {
                notFound = true;
            }
        } else {
            if (Constants.ColouredDistroIcons[iconIndex] !== undefined) {
                iconPath = this._extension.path + Constants.ColouredDistroIcons[iconIndex].PATH;
            } else {
                notFound = true;
            }
        }

        if (notFound) {
            iconPath = 'start-here-symbolic';
            this._settings.set_boolean('symbolic-icon', true);
            this._settings.set_int('menu-button-icon-image', 0);
        }

        const fileExists = GLib.file_test(iconPath, GLib.FileTest.IS_REGULAR);

        const icon = isStartHereSymbolic || !fileExists ? 'start-here-symbolic' : iconPath;

        this.icon.gicon = Gio.icon_new_for_string(icon);
    }
    setIconSize() {
        const iconSize = this._settings.get_int('menu-button-icon-size');
        this.icon.icon_size = iconSize;
    }
    
    hideIconShadow() {
    	const iconShadow = this._settings.get_boolean('hide-icon-shadow');
    	
        if(!iconShadow){
            this.icon.add_style_class_name('system-status-icon'); 
        } else {
            this.icon.remove_style_class_name('system-status-icon');
        }
    }
});

export default class LogoMenu extends Extension {
    enable() {
        this.settings = this.getSettings();

        this.settings.connectObject('changed::show-activities-button',
            () => this._setActivitiesVisibility(), this);

        this._setActivitiesVisibility();

        const indicator = new MenuButton(this);
        Main.panel.addToStatusArea('LogoMenu', indicator, 0, 'left');
    }

    disable() {
        if (!Main.sessionMode.isLocked)
            Main.panel.statusArea.activities?.container.show();

        Main.panel.statusArea['LogoMenu'].destroy();
    }

    _setActivitiesVisibility() {
        const showActivitiesButton = this.settings.get_boolean('show-activities-button');
        const activitiesButton = Main.panel.statusArea['activities'];

        if (!activitiesButton)
            return;

        if (showActivitiesButton)
            activitiesButton.container.show();
        else
            activitiesButton.container.hide();
    }
}
