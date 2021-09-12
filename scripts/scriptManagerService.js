﻿scriptManagerService.$inject = ['popupService', 'variableService', '$timeout', '$rootScope'];

function scriptManagerService(popupService, variableService, $timeout, $rootScope) {

    var scriptManager = {
        toReplace:
    [
    { from: '#autoInit', to: 'scriptManagerService.autoInit' },
    { from: '#setScreenByName', to: '$rootScope.project.setCurrentScreenByName' },
    { from: '#setScreenByIndex', to: '$rootScope.project.setCurrentScreenIndex' },
    { from: '#message', to: 'popupService.show' },
    { from: '#warningMessage', to: 'popupService.types.warning' },
    { from: '#infoMessage', to: 'popupService.types.info' },
    { from: '#errorMessage', to: 'popupService.types.error' },
    { from: '#friendly', to: 'variableService.friendlyCache' },
    { from: '#nodes', to: 'deviceService.nodes' },
    { from: '#ros', to: 'variableService.ros' },
    { from: '#createTopic' },
    { from: '#changeScreen' },
    { from: '#connectorVariable' },
    { from: '#getConnectorVariable' },
    { from: '#setConnectorVariable' },
    { from: '#getReadyConnectorVariable' },
    { from: '#timeout' },
    { from: '#autoDefine' },
    { from: '#popup' },
    { from: '#setFunction' },
    { from: '#callFunction' },
    { from: '#callService' },
    { from: '#init', to: '$rootScope.project.runInit' }
    ],

        //adds or modifies a replace 
        addScriptReplace: function (from, to) {
            //search for an already existing 
            var found = false;

            angular.forEach(scriptManager.toReplace, function (item) {
                if (item.from == from) {
                    item.to = to;
                    found = true;
                }
            });

            //if not in the list: insert
            if (!found) {
                scriptManager.toReplace.push({ from: from, to: to });
            }
        },

        compile: function (script) {
            if (!script) return script;

            //replace quick script calls
            for (var i = 0; i < scriptManager.toReplace.length; i++) {
                if (scriptManager.toReplace[i].to){
                    script = scriptManager.replaceAll(script, scriptManager.toReplace[i].from, scriptManager.toReplace[i].to);
                }
                else if (script.indexOf && script.indexOf(scriptManager.toReplace[i].from) != -1) {
                    if (scriptManager.unknownScripts.names.indexOf(scriptManager.toReplace[i].from) == -1) {
                        scriptManager.unknownScripts.names.push(scriptManager.toReplace[i].from);
                        scriptManager.unknownScripts.alertVisible = false;
                    }

                    script = scriptManager.replaceAll(script, scriptManager.toReplace[i].from, "scriptManagerService.unknownScripts.doNothing");
                }
            }

            //replace friendlyCache variables
            var friendlyNameVars = scriptManager.getAllFriendlyVars(script);
            for (var i = 0; i < friendlyNameVars.length; i++) {
                var friendly = variableService.friendlyCache[friendlyNameVars[i].substring(1)];
                var userDefined = variableService.userDefined[friendlyNameVars[i].substring(1)];
                //replace deep friendly names with their full expression (if there is any)
                var isDeep = friendly && variableService.friendlyCache[friendlyNameVars[i].substring(1)].__isDeep;
                var replaceTo =
                    userDefined ? "variableService.userDefined['" + friendlyNameVars[i].substring(1) + "']" :
                    isDeep ? variableService.friendlyCache[friendlyNameVars[i].substring(1)].value : "variableService.getFriedlyVariable('" + friendlyNameVars[i].substring(1) + "')";

                script = scriptManager.replaceAll(script, friendlyNameVars[i], replaceTo);
            }

            if (scriptManager.unknownScripts.names.length > 0 && !scriptManager.unknownScripts.alertVisible && $rootScope.pluginCount == $rootScope.downloadedAddonCount) {
                scriptManager.unknownScripts.timeout = $timeout(function () {
                    if (!scriptManager.unknownScripts.alertVisible) {
                        scriptManager.unknownScripts.alertVisible = true;
                        bootbox.alert(localization.format(localization.currentLocal.wizard.unknownWizard, [scriptManager.unknownScripts.names.join(", <br />")]),
                            function () {

                            });
                    }
                }, 500, true);
            }
            
            return script;
        },

        //unkown scripts
        unknownScripts: {
            names: [],
            alertVisible: false,
            doNothing: function(){

            },
            timeout: null
        },

        getAllFriendlyVars: function (script) {
            var reg = /(\@+[a-zA-Z_][a-zA-Z0-9_]*)/g;
            var matches = [], found;
            while (found = reg.exec(script)) {
                matches.push(found[0]);
            }
            return matches.sort(function (a, b) {
                return b.length - a.length;
            });
        },


        autoInit: function (name, value) {
            try {
                if (eval("typeof(" + name + ")== 'undefined'")) {
                    if (typeof value === 'string' || value instanceof String)
                        value = "'" + value + "'";

                    var script = "";

                    if (typeof value === 'object') {
                        script = name + "= JSON.parse('" + JSON.stringify(value) + "')";
                    } else {
                        script = name + "=" + value;
                    }

                    eval(script);
                }
            }
            catch (ex) {
                popupService.show(localization.currentLocal.settings.tabs.initScript.autoInitException + ": " + ex.message, popupService.types.error);
            }
        },

        replaceAll: function (string, find, replace) {
            if (string == null || string == undefined) return;
            if (typeof string == "string")
                return string.replace(new RegExp(find, 'g'), replace);
            else {
                return string;
            }
        },
    }

    return scriptManager;
}