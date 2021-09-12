angular.module("flexGuiApp", ["ngCookies", "ngRoute", 'ngSanitize', "ui.bootstrap-slider", "perfect_scrollbar", "jg.knob", "hmTouchEvents", "ngCordova", "angularStats", "ui.router", "oc.lazyLoad"])
    .directive("ngFileSelect", ngFileSelect)
    .directive("fgFidgetRepeater", function () {
        var directive = {
            restrict: 'AEC', 
            template: function (elm, attr) {
                return "<div class='fidget {{fidget.properties.name}}' ng-if='fidget.template && !(fidget.properties.hidden && !editHandler.isEditMode)' id='{{fidget.id}}' ng-repeat='fidget in " + attr.fidgets + " track by fidget.id' ng-if=\"!(fidget.properties.hidden && !editHandler.isEditMode)\" ng-class=\"{'notSelectable': editHandler.selectableFidgets != null && editHandler.selectableFidgets.indexOf(fidget.id) == -1,  'editModeOn': editHandler.isEditMode, 'hidden': fidget.properties.hidden && !editHandler.isEditMode, 'selected': editHandler.selectedFidgets.indexOf(fidget) >= 0  }\" style=\"left:{{fidget.properties.left}}px; top: {{fidget.properties.top}}px;\">" +
                           "<div ng-class=\"{'disabled': [false, 'false', 0].indexOf(fidget.properties.enabled) != -1 ,'clickable': !editHandler.isEditMode && [undefined, 'undefined', '', null, 'null'].indexOf(fidget.properties.onClick) == -1, 'selectedFidget': editHandler.selectedFidgets.indexOf(fidget) > -1 && editHandler.isEditMode, 'dragged': editHandler.selectedFidgets.length > 0 && editHandler.isMouseDown && !editHandler.inResize && editHandler.selectedFidgets.indexOf(fidget) > -1 }\">" +
                                "<ng-include ng-controller='fidgetCtrl' ng-init='initFidget(fidget)' src=\"toTrustedUrl(fidget.template.root + fidget.template.source + '.html')\"></ng-include>" +
                           "</div>" +
                       "</div>";
            },
        };

        return directive;
    }).directive('scrollTopOnRefresh', function () {
        return function (scope, element, attrs) {
            if (scope.$last) {
                setTimeout(function () {
                    //if the last element is loaded, scroll to the bottom of the message list
                    $(".scrollTop").each(function () {
                        $(this).scrollTop(0);
                    });
                }, 500);
            }
        };
    }).directive('scrollBottomOnRefresh', function () {
        return function (scope, element, attrs) {
            if (scope.$last) {
                setTimeout(function () {
                    //if the last element is loaded, scroll to the bottom of the message list
                    $(".scrollBottom").each(function () {
                        $(this).scrollTop($(this).find(".scrollItems").prop('scrollHeight'));
                    });
                }, 500);
            }
        };
    }).directive('showPerfectScrollBar', function () {
        return function (scope, element, attrs) {
            setTimeout(function () {
                $(".perfectScrollBar").each(function () {
                    $(this).perfectScrollbar('update');
                });
            }, 500);
        };
    }).directive('imageload', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('load', function () {
                    //call the function that was passed
                    scope.$apply(attrs.imageload);
                });
            }
        };
    }).directive('imageerror', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('error', function () {
                    //call the function that was passed
                    scope.$apply(attrs.imageerror);
                });
            }
        };
    }).directive('compile', ['$compile', function ($compile) {
        return function (scope, element, attrs) {
            scope.$watch(
              function (scope) {
                  return scope.$eval(attrs.compile);
              },
              function (value) {
                  element.html(value);
                  $compile(element.contents())(scope);
              }
           )
        };
    }]).filter('isTopicFilter', function () {
        return function (items, value) {
            var filtered = [];
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var isTopic = item.isTopic || false;
                if (isTopic === value) {
                    filtered.push(item);
                }
            }
            return filtered;
        };
    }).filter('orderObjectBy', function () {
        return function (items, field, reverse) {
            var filtered = [];
            angular.forEach(items, function (item) {
                filtered.push(item);
            });
            filtered.sort(function (a, b) {
                return (a[field] > b[field] ? 1 : -1);
            });
            if (reverse) filtered.reverse();
            return filtered;
        };
    }).filter('stringSort', function () {
        return function (input) {
            return input.sort();
        }
    })
.controller('flexGuiCtrl', flexGuiCtrl)
.controller('propertiesWindowCtrl', propertiesWindowCtrl)
.controller('fidgetCtrl', fidgetCtrl)
.controller('inputCtrl', inputCtrl)
.controller('imageCtrl', imageCtrl)
.controller('fidgetGroupCtrl', fidgetGroupCtrl)
.factory('backgroundService', backgroundService)
.factory('editorService', editorService)
.factory('deviceService', deviceService)
.factory('imageService', imageService)
.factory('fidgetService', fidgetService)
.factory('projectService', projectService)
.factory('projectWindowService', projectWindowService)
.factory('historyService', historyService)
.factory('enumService', enumService)
.factory('variableService', variableService)
.factory('clipboardService', clipboardService)
.factory('settingsWindowService', settingsWindowService)
.factory('helpService', helpService)
.factory('popupService', popupService)
.factory('scriptManagerService', scriptManagerService)
.factory('colorPickerService', colorPickerService)
.factory('projectConversionService', projectConversionService)
.factory('projectStorageService', projectStorageService)
.factory('diagnosticsService', diagnosticsService)
.factory('backupService', backupService)
.factory('iconService', iconService)
.config(appConfig)
.config(['$ocLazyLoadProvider', function ($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({
        modules: [

        ],
        asyncLoader: $script
    });
}])
.run(run);

appConfig.$inject = ['$controllerProvider', '$compileProvider', '$filterProvider', '$provide'];
function appConfig($controllerProvider, $compileProvider, $filterProvider, $provide) {
    window.lazy = {
        controller: $controllerProvider.register,
        directive: $compileProvider.directive,
        filter: $filterProvider.register,
        factory: $provide.factory,
        service: $provide.service
    };
}

ngFileSelect.$inject = ['$parse', 'projectWindowService'];
function ngFileSelect($parse, projectWindowService) {
    var directiveDefinitionObject = {
        restrict: 'A',
        scope: {
            method: '&ngFileSelect',
        },
        link: function (scope, element, attrs) {
            var expressionHandler = scope.method();
            element.bind('change', function (e) {
                expressionHandler(e.target.files[0]);
            });
        }
    };
    return directiveDefinitionObject;
}

run.$inject = ['$rootScope', '$templateCache', '$injector', 'popupService', '$location', '$timeout', '$ocLazyLoad', '$cookies', '$window', 'settingsWindowService', '$sce', 'projectService', 'variableService', 'deviceService'];
function run($rootScope, $templateCache, $injector, popupService, $location, $timeout, $ocLazyLoad, $cookies, $window, settingsWindowService, $sce, projectService, variableService, deviceService) {
    if (!$rootScope.settingsTabs) $rootScope.settingsTabs = [];
    if (!$rootScope.screenAddons) $rootScope.screenAddons = [];

    //$rootScope.frameLimit = Number.MAX_SAFE_INTEGER;

    ////limit UI refresh on mobiles to save resources
    //var scopePrototype = Object.getPrototypeOf($rootScope);
    //var oldDigest = scopePrototype.$digest;
    //var lastDigest = Date.now();
    //scopePrototype.$digest = function $digest() {
    //    var millis = (Date.now() - lastDigest);

    //    if (millis > 100 || $rootScope.frameLimit === Number.MAX_SAFE_INTEGER) {
    //        oldDigest.apply(this, arguments);
    //        lastDigest = Date.now();
    //    }
    //};

    $rootScope.mirrorMode = {};
    $rootScope.currentUserId = "user_" + variableService.guid();
    projectService.appVersion = "2.0.0";

    //set ROS address with query string
    var queryString = $location.search();
    if (queryString && queryString.RosUrl) {

        console.log("Using ROS server in the query string");    

        //get parameters from query string
        var rosurl = queryString.RosUrl, ip, port, wss = false;
        if (rosurl.indexOf("wss") === 0) {
            wss = true;
            ip = rosurl.substring(6, rosurl.lastIndexOf(":"));
        } else {
            ip = rosurl.substring(5, rosurl.lastIndexOf(":"));
        }

        port = rosurl.substring(rosurl.lastIndexOf(":") + 1);

        //setup parameters
        deviceService.port = port;
        deviceService.ip = ip;
        deviceService.secure = wss;

        settingsWindowService.demoMode = false;
    }

    $.getJSON('settings.json', function (settings) {

        $rootScope.flexguiSettings = settings;
        $rootScope.addonServerUrl = deviceService.localAddons || $rootScope.flexguiSettings.mode ? "" : "http://" + deviceService.ip + ":16735/";

        if ($rootScope.flexguiSettings.forceAuth == "true" && $rootScope.flexguiSettings.buildInPluginLogin != "true") {
            function checkAuth() {
                if (!$cookies.get("FlexGui40Trial")) {
                    $window.location.href = $rootScope.flexguiSettings.serverUrl + "?ret=" + $window.location.href;
                }
            }

            checkAuth();
            window.setInterval(function () {
                //if we want to force authentication on server
                checkAuth();
            }, 5000);
        }

        if ($rootScope.flexguiSettings.testVersion) {
            popupService.show($rootScope.flexguiSettings.testVersion);
        }

        //if we want to force authentication on server
        if ($rootScope.flexguiSettings.forceAuth == "true" && !$cookies.get("FlexGui40Trial") && $rootScope.flexguiSettings.buildInPluginLogin != "true") {
            $window.location.href = $rootScope.flexguiSettings.serverUrl + "?ret=" + $window.location.href;
        }

        //we have to keep alive the session id while FlexGui is online
        function keepAlive(data, onSuccessCallback) {
            $.post($rootScope.flexguiSettings.serverUrl + "Trial/KeepAlive", { session: data }).success(function (json) {
                var response = JSON.parse(json);

                //setup the trial's parameters
                $rootScope.trialRemainingDays = response.RemainingDays;
                $rootScope.trialMaxDays = response.MaxDays;
                $rootScope.trialSerial = response.Serial;

                //0: alive, 1: license not found, 2: expired
                switch (response.State) {
                    case 0:
                        $timeout(function () { keepAlive(data) }, 10000, false);
                        break;
                    case 1:
                        popupService.show($sce.trustAsHtml(localization.format(localization.currentLocal.licensing.licenseNotFound, [$rootScope.flexguiSettings.websiteUrl + "Account/Profile"])), popupService.types.info);
                        break;
                    case 2:
                        popupService.show($sce.trustAsHtml(localization.currentLocal.licensing.licenseExpired), popupService.types.info);
                        break;
                    case 3:
                        popupService.show($sce.trustAsHtml(localization.currentLocal.licensing.notGenerated), popupService.types.warning);
                        break;
                }

                if (onSuccessCallback) onSuccessCallback();

            }).error(function () {
                //remove cookie and go to login page
                if ($rootScope.flexguiSettings.buildInPluginLogin != "true") {
                    delete $rootScope.sessionCookie;
                    $window.location.href = $rootScope.flexguiSettings.serverUrl + "?ret=" + $window.location.href;
                }
            });
        }

        //get promotions
        $.post($rootScope.flexguiSettings.serverUrl + "Trial/Promotion").success(function (json) {
            var data = JSON.parse(json);
            if (data.hasPromotion) {
                popupService.show(data.html);
            }
        });

        if (!settingsWindowService.trial.mode) {
            //use local plugins
            console.log("Load local plugins");

            $rootScope.sessionCookie = true;

            $.getJSON($rootScope.addonServerUrl + "addons/list.json", function (list) {
                $rootScope.pluginCount = list.length;
                $rootScope.downloadedAddonCount = 0;

                angular.forEach(list, function (item) {
                    loadAddon(item);
                });
            }).error(function (jqXHR, textStatus, errorThrown) {
                popupService.show("Error downloading addon list, please check your ROS Server settings!");

                console.log("Error downloading addon list " + textStatus);

                $rootScope.pluginCount = 0;
                $rootScope.downloadedAddonCount = 0;

            });
        } else {
            //use trial plugins
            console.log("Load trial plugins");
            if ($rootScope.flexguiSettings.buildInPluginLogin == "true") {
                console.log("Get session ID");

                var username = settingsWindowService.trial.username;
                var password = settingsWindowService.trial.password;

                if (username && password) {
                    $.post($rootScope.flexguiSettings.serverUrl + "Trial/GetSession", { Username: username, Password: password }).success(function (data) {
                        if (!data || (data && data == "")) {
                            //login failed
                            popupService.show($sce.trustAsHtml(
                                localization.format(localization.currentLocal.licensing.userError, [$rootScope.flexguiSettings.websiteUrl + "Account/Register", $rootScope.flexguiSettings.websiteUrl + "Account/Profile"]))
                                    , popupService.types.info);
                        } else {
                            //login successfull

                            $rootScope.sessionCookie = data;

                            console.log($rootScope.sessionCookie);

                            startDownloadPlugins();
                        }
                    });
                }
            } else {
                $rootScope.sessionCookie = $cookies.get("FlexGui40Trial");

                //if there is no session cookie, go to login page to get one
                if (!$rootScope.sessionCookie) {
                    $window.location.href = $rootScope.flexguiSettings.serverUrl + "?ret=" + $window.location.href;
                }

                startDownloadPlugins();
            }
        }

        function startDownloadPlugins() {
            keepAlive($rootScope.sessionCookie,
                //onSuccess action for 1st keepalive: start downloading plugins
                function () {
                    $rootScope.addonServerUrl = $rootScope.flexguiSettings.serverUrl + "Trial/Get?session=" + $rootScope.sessionCookie + "&filename=";
                    $.getJSON($rootScope.flexguiSettings.serverUrl + "Trial/Addons?session=" + $rootScope.sessionCookie, function (list) {
                        $rootScope.pluginCount = list.length;
                        $rootScope.downloadedAddonCount = 0;

                        angular.forEach(list, function (item) {
                            loadAddon(item);
                        });
                    }).error(function (jqXHR, textStatus, errorThrown) {
                        console.log("Error downloading addon list " + textStatus);
                        $rootScope.$apply(function () {
                            $rootScope.pluginCount = 0;
                            $rootScope.downloadedAddonCount = 0;
                        });
                    });
                });
        }
    });

    //loads a given addon
    function loadAddon(addon) {
        var serviceName = addon.service;
        jQuery.ajax({
            type: "GET",
            url: $rootScope.addonServerUrl + addon.src,
            dataType: "script",
            fail: function(){
                console.log("Can't load plugin: " + serviceName);
                $rootScope.downloadedAddonCount++;
            },
            success: function (data, textStatus, request) {
                try{
                    window.lazy.factory(serviceName, eval(serviceName));

                    //inject to the app
                    run.$inject.push(serviceName);

                    //instantiate
                    var servObj = $injector.get(serviceName);
                    console.log(serviceName + " addon loaded");

                    if (addon.rootScopeName) {
                        //if we need it on the root scope, put it there
                        $rootScope[addon.rootScopeName] = servObj;
                    }

                } catch(e) {
                    console.log("Can't load plugin: " + serviceName, e);
                }

                $rootScope.downloadedAddonCount++;
            }
        });
    }

    //location setup
    $rootScope.startPage = $location.path().substring(1);
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        if (typeof (current) !== 'undefined') {
            $templateCache.remove(current.templateUrl);
        }
    });

    $(window).resize(function () { $rootScope.$apply(); });
}