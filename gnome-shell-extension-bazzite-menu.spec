%global uuid logomenu@aryan_k

Name:          gnome-shell-extension-bazzite-menu
Version:       {{{ git_dir_version }}}
Release:       1%{?dist}
Summary:       Logo Menu fork that provides helpful shortcuts for the Steam Deck

Group:         User Interface/Desktops
License:       GPLv2
URL:           https://github.com/KyleGospo/Logomenu
Source0:       %{url}/archive/refs/heads/main.tar.gz
BuildArch:     noarch

BuildRequires: make
BuildRequires: unzip
BuildRequires: gettext
BuildRequires: gnome-shell
BuildRequires: glib2

Requires:    gnome-shell >= 3.12
%description
Gnome shell extension that provides a Steam Deck icon in the top bar and helpful shortcuts. A fork of Logo Menu.

%prep
%autosetup -n Logomenu-main

%install
make build
mkdir -p %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}
unzip logomenu@aryan_k.shell-extension.zip -d %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}
glib-compile-schemas %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/schemas/

%files
%license LICENSE
%{_datadir}/gnome-shell/extensions/%{uuid}/

%changelog
{{{ git_dir_changelog }}}
