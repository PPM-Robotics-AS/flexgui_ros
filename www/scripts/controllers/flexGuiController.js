flexGuiCtrl.$inject = ['$scope', '$window', '$location', '$routeParams', '$sce', '$timeout', '$rootScope', '$interval', '$injector', '$cookies',
    'editorService', 'historyService', 'deviceService', 'imageService', 'fidgetService',
    'projectService', 'enumService', 'projectWindowService', 'variableService',
    'clipboardService', 'settingsWindowService', 'colorPickerService', 'helpService', 'popupService',
    'scriptManagerService', 'projectStorageService', 'diagnosticsService', 'backupService'];

function flexGuiCtrl($scope, $window, $location, $routeParams, $sce, $timeout, $rootScope, $interval, $injector, $cookies,
        editorService,
        historyService,
        deviceService,
        imageService,
        fidgetService,
        projectService,
        enumService,
        projectWindowService,
        variableService,
        clipboardService,
        settingsWindowService,
        colorPickerService,
        helpService,
        popupService,
        scriptManagerService,
        projectStorageService,
        diagnosticsService,
        backupService
        ) {

    Array.prototype.move = function (old_index, new_index) {
        if (new_index >= this.length) {
            var k = new_index - this.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        this.splice(new_index, 0, this.splice(old_index, 1)[0]);
        return this; // for testing purposes
    };

    //block the UI
    $rootScope.blockMessage = localization.currentLocal.starting.downloadAddons + "0/" + $rootScope.pluginCount;
    var trusted = {};

    //makes a URL to trusted, so it is possible to show on UI 
    $rootScope.toTrustedUrl = function (url) {
        return trusted[url] || (trusted[url] = $sce.trustAsResourceUrl(url))
    }

    //the root dir of screen
    $rootScope.screenRoot = $rootScope.screenRoot || 'views/screen.html';

    //window size
    $scope.windowWidth = 0;

    //belt size
    $scope.beltWidth = 120;
    $scope.parseNumber = Number;
    var changing = false;
    //enables pinch zoom funcionality on mobiles
    $scope.pinchZoom = function ($event) {
        if (!$rootScope.isMobile || changing || !settingsWindowService.pinchEnabled) return;

        //use constant scale to prevent jumpings caused by the scaled coordinates
        var scale = 0;
        switch ($event.additionalEvent) {
            case "pinchin":
                scale = -0.02;
                break;
            case "pinchout":
                scale = +0.02;
                break;
        }

        //disable pinchzoom while setting up the new
        changing = true;
        $timeout(function () { settingsWindowService.setViewScale(settingsWindowService.viewScale + scale); changing = false }, 100);
    }

    //cordova device ready event listener
    document.addEventListener("deviceready", function () {
        $rootScope.isMobile = true;
        $rootScope.buildDate = BuildInfo.buildDate;
        $rootScope.frameLimit = 10;

        //enabling zoom control
        cordova.plugins.ZoomControl.ZoomControl("true");
        // enabling built in zoom control
        // cordova.plugins.ZoomControl.setBuiltInZoomControls("true");
        // enabling display zoom control
        // cordova.plugins.ZoomControl.setDisplayZoomControls("true");
        // enabling wide viewport
        cordova.plugins.ZoomControl.setUseWideViewPort("true");
    }, false);

    document.addEventListener("resize", function() {
        // Notify the fidgets to recalculate the size
        $rootScope.$apply();
    });

    //if offline mode, then setup the demo parts
    if (settingsWindowService.offlineMode) {
        /*device service demo overrides*/
        projectStorageService.setMode('localStorage');
        deviceService.init = function () {
            console.log("Download local project");
            deviceService.connected = true;
        }
    }

    projectStorageService.init();

    $rootScope.project = projectService;
    $rootScope.device = deviceService;
    $scope.nodes = deviceService.nodes;
    $scope.colorPickerHandler = colorPickerService;

    $scope.accessLevelsEnum = enumService.accessLevelsEnum;
    $scope.screenTypesEnum = enumService.screenTypesEnum;

    $rootScope.fidgets = fidgetService;
    $rootScope.settings = settingsWindowService;
    $scope.localization = localization;
    $rootScope.projects = projectWindowService;
    projectWindowService.scope = $scope;

    $rootScope.editHandler = editorService;

    $scope.is_chrome = /chrome/i.test(navigator.userAgent);
    $scope.helpMessages = helpService;
    $scope.popup = popupService;

    $rootScope.images = imageService;


    $rootScope.settings.loadLocalStorage();

    $scope.blockUI = function (msg) {
        $rootScope.blockMessage = msg;
        $scope.$apply();
    };

    $scope.variables = variableService;

    $scope.unBlockUI = function () {
        $rootScope.blockMessage = null;
        $scope.$apply();
    };

    $scope.dragCorner = enumService.dragCorner;
    $scope.isModalVisible = function () {
        var visible = editorService.propertiesWindowVisible ||
            $rootScope.settings.visible ||
            $scope.projects.visible ||
            $rootScope.images.visible ||
            $scope.colorPickerModalVisible ||
            $scope.helpMessages.open != null ||
            $scope.popup.visible ||
            $rootScope.blockMessage != null;

        return visible;

    };

    $scope.historyHandler = historyService;
    $scope.clipboardHandler = clipboardService;

    $rootScope.drive = projectStorageService;
    $rootScope.extraButtonsForSettingsWindow = [];
    $rootScope.editScreen = function (screen) {
        if (screen.editDisabled) return;

        historyService.saveState();
        projectService.setCurrentScreen(screen);
        editorService.editedFidget = screen;
        editorService.propertiesWindowVisible = true;
    }

    if (typeof ($.timeago) != "undefined") {
        jQuery.timeago.settings.strings = localization.currentLocal.timeago.settings.strings;
    }

    $window.scriptManager = scriptManagerService;

    $scope.activeRemoteView;
    $scope.setActiveRemoteView = function (fidget) {
        activeRemoteView = fidget;
    }

    $rootScope.addModal = function (name, src, ngIf) {
        $rootScope.modals[name] = {
            src: src,
            visible: false
        };

        $rootScope.$watch(function () { return eval(ngIf) }, function (nv, ov) { $rootScope.modals[name].visible = nv; }, true);
    }

    var addonWatcher = $rootScope.$watch(function () {
        return $rootScope.downloadedAddonCount;
    }, function (nv) {
        var pluginCount = $rootScope.pluginCount || 0;
        var downloadedAddonsCount = nv || 0;
        $rootScope.blockMessage = localization.currentLocal.starting.downloadAddons + downloadedAddonsCount + "/" + pluginCount;

        //add default screens after all of the plugins loaded
        if (isNaN(nv) == false && nv == $rootScope.pluginCount) {
            console.log("All addon loaded(" + nv + "), initalizing project");
            deviceService.init($location);
            imageService.init($scope);
            editorService.init($scope.beltWidth);
            addonWatcher();
        }
    });

    $rootScope.modals = {};
    $rootScope.addModal("addScreen", "views/addScreen.html", "projectService.addScreenVisible");
    $rootScope.addModal("propertiesWindow", "views/propertiesWindow.html", "editorService.propertiesWindowVisible");
    $rootScope.addModal("settingsWindow", "views/settingsWindow.html", "settingsWindowService.visible");
    $rootScope.addModal("imageExplorerWindow", "views/imageExplorerWindow.html", "imageService.visible");
    $rootScope.addModal("colorPickerWindow", "views/colorPickerWindow.html", "colorPickerService.colorPickerModalVisible");
    $rootScope.addModal("topicDetailsWindow", "views/topicDetailsWindow.html", "$rootScope.settings.topicDetails.visible");
    $rootScope.addModal("editTestItemWindow", "views/settings/diagnostics/testItemEditor.html", "diagnosticsService.isTestItemEditorOpen");
    $rootScope.addModal("diagnosticsResultWindow", "views/settings/diagnostics/result.html", "diagnosticsService.isResultOpen");

    $scope.$on("$locationChangeSuccess", function (event, newUrl) {
        //records the location to a global variable, because modules need to access it too
        var requestLocation = $location.path().substring(1);
        projectService.setCurrentScreenByName(requestLocation);
    });

    //makes and url friendly string from a custom string
    $scope.slugify = function (text) {
        return text.toString().toLowerCase()
          .replace(/\s+/g, '-')           // Replace spaces with -
          .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
          .replace(/\-\-+/g, '-')         // Replace multiple - with single -
          .replace(/^-+/, '')             // Trim - from start of text
          .replace(/-+$/, '');            // Trim - from end of text
    }

    $scope.onScreenClick = function (screen, $event) {
        $location.path(screen.properties.name);
    }

    //Prevents sanitizing of the HTML parameter. Only use for non-user input!
    $scope.toTrustedHTML = function (html) {
        return $sce.trustAsHtml(html);
    }

    //Makes the website go full screen
    $scope.goFullScreen = function () {
        window.document.documentElement.webkitRequestFullScreen();
    }

    $scope.logoStyles = {
        bottomRight: { position: 'relative', right: 10, bottom: 10 },
        bottomLeft: { position: 'relative', left: 10 + $scope.beltWidth, bottom: 10 },
        topRight: { position: 'relative', right: 10, top: 10 },
        topLeft: { position: 'relative', left: 10 + $scope.beltWidth, top: 10 }
    };

    $scope.copyHtmlById = function (id) {
        return $("#" + id).text();
    }

    $timeout(function () {
        $rootScope.hideCover = true;
        settingsWindowService.showStatistics();
    }, 2000);
};