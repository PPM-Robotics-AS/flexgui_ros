advancedScriptingService.$inject = ['$sce', '$ocLazyLoad', 'projectService', 'popupService', 'settingsWindowService', '$rootScope', 'scriptManagerService', 'fidgetService', 'variableService', 'deviceService', 'projectStorageService', 'diagnosticsService', 'helpService', '$timeout'];

/*

Add advanced scripting functionality:
- ACE script editor with javascript support
- onClick event for all fidgets
- ROS variable change event

*/

function advancedScriptingService($sce, $ocLazyLoad, projectService, popupService, settingsWindowService, $rootScope, scriptManagerService, fidgetService, variableService, deviceService, projectStorageService, diagnosticsService, helpService, $timeout) {
    //load advanced javascript editor 
    $.getScript($rootScope.addonServerUrl + "addons/advancedScripting/scripts/3rdParty/ace/src/ace.js", function () {
        $.getScript($rootScope.addonServerUrl + "addons/advancedScripting/scripts/3rdParty/ace/src/mode-javascript.js", function () {
            $ocLazyLoad.load({
                name: 'ui.ace',
                files: [$rootScope.addonServerUrl + 'addons/advancedScripting/scripts/3rdParty/ace/ui-ace.js']
            }).then(function () {
            });
        });
    });

    //add style sheet param for project
    projectService.extraParamGetters.push(function (o) {
        o.styleSheet = projectService.styleSheet;

        return o;
    });

    //add extra clean param getters
    projectService.extraCleanParamGetters.push(function (o) {
        o.styleSheet = "";

        return o;
    });

    //add extra param setters
    projectService.extraParamSetters.push(function (proj) {
        projectService.styleSheet = "";
        if (proj.styleSheet) projectService.styleSheet = proj.styleSheet;
    });

    //check if onload/onunload is added or not
    addScreenChangeScript = function () {
        angular.forEach(projectService.screens, function (screen) {
            if (!screen.properties.onLoad) screen.properties.onLoad = "/* onLoad script here */";
            if (!screen.properties.onUnload) screen.properties.onUnload = "/* onUnload script here */";
        });
    }

    //add localization
    angular.forEach(Object.keys(localization.items), function (key) {
        localization.items[key].fidgets.properties.onLoad = "On load script";
        localization.items[key].fidgets.properties.onUnload = "On unload script";
        localization.items[key].settings.tabs.styleSheet = { title: "Style", note: "Here you can edit the global CSS Style of your Project" }
        localization.items[key].help.styleSheet = { title: "Style sheet", text: "Here you can edit the global CSS Style of your Project" }
    });

    //add script editors
    projectService.editors.onLoad = $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/advancedScripting/views/editors/script.html");
    projectService.editors.onUnload = $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/advancedScripting/views/editors/script.html");

    //check screens
    $rootScope.$watch(function () { return projectService.loaded; }, function () { addScreenChangeScript(); });
    $rootScope.$watch(function () { return projectService.screens.length; }, function () { addScreenChangeScript(); });

    //add style tab
    helpService.settings.styleSheet = {
        for: localization.currentLocal.help.styleSheet.header,
        source: $rootScope.addonServerUrl + 'addons/advancedScripting/views/help/styleSheet.html'
    }

    $rootScope.settingsTabs.styleSheet = { help: helpService.settings.styleSheet, position: 3, source: $rootScope.addonServerUrl + "addons/advancedScripting/views/settings/styleSheet.html", title: localization.currentLocal.settings.tabs.styleSheet.title, classes: "settingsScriptTab" };
    $rootScope.settingsTabs.project.children.push($rootScope.settingsTabs.styleSheet);
    $rootScope.$watch(function () { return projectService.styleSheet; }, function (nv) {
        $("#projectStyle").remove();
        var style = '<style id="projectStyle">' + nv + '</style>';
        $("head").append(style);
    });

    //watch screen change
    $rootScope.$watch(function () { return projectService.currentScreen && projectService.currentScreen.properties.name; }, function (nv, ov) {
        var ns = projectService.findScreen(nv);
        var os = projectService.findScreen(ov);

        if (os && os.properties.onLoad) {
            try {
                eval(scriptManagerService.compile(os.properties.onUnload));
            } catch (e) {
                popupService.show(e.message, popupService.types.error);
                console.log("Unload script for screen failed to run", e);
            }
        }

        if (ns && ns.properties.onLoad) {
            try {
                eval(scriptManagerService.compile(ns.properties.onLoad));
            } catch (e) {
                popupService.show(e.message, popupService.types.error);
                console.log("Load script for screen failed to run", e);
            }
        }
    });

    //get editor controller
    $.getScript($rootScope.addonServerUrl + "addons/advancedScripting/scripts/controllers/scriptEditorController.js", function () {
        //load editor controller to angularjs
        window.lazy.controller("scriptEditorController", scriptEditorController);

        $rootScope.$apply(function () {
            $rootScope.onClickEditor = $sce.trustAsResourceUrl($rootScope.addonServerUrl + 'addons/advancedScripting/views/properties/onClick.html');
            $rootScope.$watchCollection(function () { return fidgetService.templates }, function () {
                //add onClick for all fidget templates
                angular.forEach(fidgetService.templates, function (template) {
                    if (template.properties.onClick == undefined)
                        template.properties.onClick = "";
                });
            });

            //project's onChange editor for ROS topics
            projectService.changeScriptEditor = {
                //current script with default value
                script: "/* onChange script here */",

                //visibility property for the modal
                visible: false,

                //current topic of the editor
                currentTopic: null,

                //set current topic for the editor window
                setCurrentTopic: function (t) {
                    projectService.changeScriptEditor.currentTopic = t;
                    if (projectService.interfaceMetaData.getOnChangeScript(t.path)) {
                        this.script = projectService.interfaceMetaData.getOnChangeScript(t.path);
                    } else {
                        this.script = '/* onChange script here */';
                    }
                },

                //editor window visible set + topic
                setVisible: function (v, t) {
                    if (v && t) {
                        this.visible = true;
                        this.setCurrentTopic(t);
                    } else {
                        this.visible = false;
                    }
                },

                //save onchange script and check if it is okay or not
                saveScript: function (saveProject) {
                    projectService.interfaceMetaData.setOnChangeScript(projectService.changeScriptEditor.currentTopic.path, projectService.changeScriptEditor.script);
                    projectService.changeScriptEditor.setVisible(false);
                    projectStorageService.save(false);
                }
            },

            //set the onchange script in the project's interface meta data
            projectService.interfaceMetaData.setOnChangeScript = function (path, script) {
                var meta = this.find(path);
                //if meta doesn't exist and subscribed is false, nothing to do
                if (!meta)
                    return;
                    //meta doesn't exist, friendlyName isn't empty
                else if (!meta && script) {
                    meta = this.add(path);
                    meta.onChangeScript = script;
                } else {
                    meta.onChangeScript = script;
                }
            }

            //Returns the deep friendly names of the metadata if exists.
            projectService.interfaceMetaData.getOnChangeScript = function (path) {
                var meta = this.find(path);
                return meta == null || !meta.onChangeScript ? null : meta.onChangeScript;
            }

            //change init script editor to ACE
            $rootScope.settingsTabs.init.source = $rootScope.addonServerUrl + "addons/advancedScripting/views/settings/init.html";
            //onChange scripts for topics
            projectService.changeScripts = {};

            //overwrite interface list
            settingsWindowService.interfaces = {
                header: $sce.trustAsResourceUrl($rootScope.addonServerUrl + 'addons/advancedScripting/views/settings/nodes/header.html'),
                item: $sce.trustAsResourceUrl($rootScope.addonServerUrl + 'addons/advancedScripting/views/settings/nodes/interface.html')
            };

            //add scripteditor modal
            $rootScope.addModal("scriptEditorWindow", $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/advancedScripting/views/scriptEditorWindow.html"), "projectService.changeScriptEditor.visible");
            diagnosticsService.scriptEditor = $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/advancedScripting/views/settings/diagnostics/scriptEditor.html");

            var changed = [], lastIndex = 0; changedRunnig = false;
            deviceService.changedTopicWatchers.push({ get: function () { return lastIndex; }, set: function (v) { lastIndex = v; } });
            //watch the changed topic and run the onchangescript if existing
            $rootScope.$watchCollection(function () { return deviceService.changedTopics }, function (nv, ov) {
                //copy new items to changed array and save the index in changed topic
                for (var i = lastIndex; i < deviceService.changedTopics.length; i++) {
                    changed.push(deviceService.changedTopics[i]);
                    lastIndex++;
                }

                if (changedRunnig || !projectService.loaded) return;

                var i = changed.length;
                while (i--) {
                    changedRunnig = true;
                    //go through all of the topics one by one and run the onchange script if there is any
                    var item = changed[i];
                    if (projectService.interfaceMetaData.getOnChangeScript(item.topic.path)) {
                        //pass new value and old value to the script
                        var newValue = item.topic.value;
                        var oldValue = item.oldValue;
                        try {
                            eval(scriptManagerService.compile(projectService.interfaceMetaData.getOnChangeScript(item.topic.path)));
                        } catch (e) {
                            popupService.show(e.message, popupService.types.error);
                            console.log("Change script for " + item.topic.path + " failed to run", e);
                        }
                    }

                    //remove item
                    changed.splice(i, 1);
                }

                changedRunnig = false;
            });
        });
    });

    return {};
}