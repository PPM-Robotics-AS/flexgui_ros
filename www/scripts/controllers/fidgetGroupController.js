fidgetGroupCtrl.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService',
    'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService',
    '$timeout', '$rootScope', 'colorPickerService'];

function fidgetGroupCtrl($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService,
    popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService,
    $timeout, $rootScope, colorPickerService) {

    function updateStyle() {
        $scope.style = {
            width: $scope.fidget.properties.width + "px",
            height: $scope.fidget.properties.height + "px",
            opacity: editorService.activeContainer == $scope.fidget && !editorService.inResize ? 0.5 : 1,
            border: $scope.fidget.properties.borderWidth + "px solid " + $scope.fidget.properties.borderColor,
            background: colorPickerService.getRGBAString(colorPickerService.convertHex($scope.fidget.properties.color, $scope.fidget.properties.opacity * 100)),
        }
    }

    //hold reference to watchers to be able to remove when it is necesarry
    var watchers = [];
    $scope.initGroup = function () {

        //remove existing watchers
        angular.forEach(watchers, function (w) { w(); });
        watchers = [];

        updateStyle();

        //add watchers to be able to calculate the size
        watchers.push($scope.$watchCollection(function () { return $scope.fidget.fidgets; }, function () {
            updateFidgets($scope.fidget);
        }));

        watchers.push($scope.$watchGroup([
            function () { return $scope.fidget.properties.color; },
            function () { return $scope.fidget.properties.opacity; },
            function () { return $scope.fidget.properties.borderColor; },
            function () { return editorService.inResize; },
            function () { return editorService.activeContainer; }
        ], function () {
            updateStyle();
        }));

        watchers.push($scope.$watchGroup([
            function () { return $scope.fidget.properties.layout; },
            function () { return $scope.fidget.properties.width; },
            function () { return $scope.fidget.properties.height; },
            function () { return $scope.fidget.fidgets.length; },
            function () { return $scope.fidget.properties.borderWidth; },
            function () { return $scope.fidget.properties.margin; },
            
        ],
            function () {
                updateStyle();
                updateFidgets($scope.fidget);
            }));
    }

    //update child fidgets
    function updateFidgets(fidget) {
        if (!fidget.properties.layout) return;

        var l = fidget.properties.layout;
        var w = (100 / fidget.fidgets.length).toFixed(0);
        var i = 0;
        var m = fidget.properties.margin;
        var c = fidget.fidgets.length;

        angular.forEach(fidget.fidgets, function (f) {
            f.properties.width = l == "vertical" ? "100%" : w.toString() + "% - " + m * (c - 1) / c;
            f.properties.height = l == "vertical" ? w.toString() + "% - " + m * (c - 1) / c : "100%";
            f.properties.top = l == "horizontal" ? "0" : i * (f.properties.height + m);
            f.properties.left = l == "horizontal" ? i * (f.properties.width + m) : "0";

            i++;
        });
    }
}