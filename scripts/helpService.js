function helpService() {
    var helpMessages = {
        show: localStorage.getItem("showHelpmessages") == "false" ? false : true,
        //Shows the help ?-s around the UI.
        setShow: function (value) {
            helpMessages.show = value;

            localStorage.setItem("showHelpmessages", value);
        },
        open: null,
        //Sets the help message to show. The helpMessage window opens if not null.
        setOpen: function (help) {
            helpMessages.open = help;
        },

        //Metadata for settings
        settings: {
            general: {
                for: localization.currentLocal.help.settings.header,
                source: 'views/help/generalSettings.html'
            },
            initScript: {
                for: localization.currentLocal.help.initScript.header,
                source: 'views/help/initScript.html'
            },
            nodes: {
                for: localization.currentLocal.help.nodes.header,
                source: 'views/help/nodes.html'
            },
            connectionSettings: {
                for: localization.currentLocal.help.connectionSettings.header,
                source: 'views/help/connectionSettings.html'
            },
            project: {
                for: localization.currentLocal.help.project.header,
                source: 'views/help/project.html'
            },
            language: {
                for: localization.currentLocal.help.language.header,
                source: 'views/help/language.html'
            },
            enterprise: {
                for: localization.currentLocal.help.enterprise.header,
                source: 'views/help/enterprise.html'
            },
            diagnostics: {
                for: localization.currentLocal.help.diagnostics.header,
                source: 'views/help/diagnostics_main.html'
            }
        },
        fidgetBelt: {
            for: localization.currentLocal.help.fidgetBelt.header,
            source: 'views/help/fidgetBelt.html'
        },
        screenBelt: {
            for: localization.currentLocal.help.screenBelt.header,
            source: 'views/help/screenBelt.html'
        },
        fidgetGroup: {
            for: localization.currentLocal.help.fidgetGroup.header,
            source: 'views/help/fidgetGroup.html'
        },
        image: {
            for: localization.currentLocal.help.image.header,
            source: 'views/help/image.html'
        },
        propertiesWindow: {
            for: localization.currentLocal.help.propertiesWindow.header,
            source: 'views/help/propertiesWindow.html'
        },
        colorPick: {
            for: localization.currentLocal.help.colorPick.header,
            source: 'views/help/colorPick.html'
        },
        imageExplorer: {
            for: localization.currentLocal.help.imageExplorer.header,
            source: 'views/help/imageExplorer.html'
        },
        loginWindow: {
            for: localization.currentLocal.help.loginWindow.header,
            source: 'views/help/loginWindow.html'
        },
        cameraImage: {
            for: localization.currentLocal.help.cameraImage.header,
            source: 'views/help/cameraImage.html'
        }

    }

    return helpMessages;
}