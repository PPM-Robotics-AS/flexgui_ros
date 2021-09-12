fidgetCtrl.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService',
    'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService',
    '$timeout', '$rootScope', 'imageService', 'colorPickerService'];

function fidgetCtrl($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService,
    popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService,
    $timeout, $rootScope, imageService, colorPickerService) {

    var imageResizeTimer = null;
    //calculates the size of the indicator lamp
    var indicatorLampSize = function (fidget) {
        if (fidget.properties.width > fidget.properties.height) return fidget.properties.height;

        return fidget.properties.width;
    }

    //onClick method for all fidgets. The current fidget is available in the script as 'fidget'.
    $scope.onClick = function (fidget, event) {
        if (editorService.selectedFidgets.length == 0) {
            eval(scriptManagerService.compile(fidget.properties.onClick));
        }

        event.stopPropagation();
    }

    $scope.lock = function (fidget, event) {
        //prevent multiple clicks
        $("#" + fidget.id).addClass("locked");
        $timeout(function () {
            //reenable after the digest cycle
            $("#" + fidget.id).removeClass("locked");
        }, 200, false);

        if (event && event.stopPropagation)
            event.stopPropagation();
    }

    //make trusted links
    $scope.trustAsResourceUrl = $sce.trustAsResourceUrl;

    //fidget press event for screen change
    $scope.onFidgetPress = function (fidget) {
        if (fidget.properties.screenLink) {
            var screen = projectService.findScreenById(fidget.properties.screenLink);
            if (screen) {
                $location.path(screen.properties.name);
            }
        }
    }

    //sets the value for a fidgets property
    $scope.setValue = function (fidget, value) {
        fidget.properties.value = value;
    }

    $scope.initRotate = function () {
        $scope.$watchGroup([
            function () { return $scope.fidget.properties.width },
            function () { return $scope.fidget.properties.height },
            function () { return $scope.fidget.properties.angle }], function () {

                //rotate size
                _preSize = angular.copy($scope.size);
                $scope.size = variableService.fitRect(editorService.getFidgetSize($scope.fidget), $scope.fidget.properties.angle * (Math.PI / 180));
                $scope.center = { x: ($scope.fidget.properties.width - $scope.size.width) / 2, y: ($scope.fidget.properties.height - $scope.size.height) / 2 };

                if (_preSize) {
                    _h = ((_preSize.height - $scope.size.height) / 2);
                    if (_.isNumber(_h) && _.isNumber($scope.fidget.properties.top))
                        $scope.fidget.properties.top += _h;

                    _l = ((_preSize.width - $scope.size.width) / 2);
                    if (_.isNumber(_l) && _.isNumber($scope.fidget.properties.left)) {
                        $scope.fidget.properties.left += _l;
                    }
                }
            });
    }

    $scope.initFidget = function () {
        $scope.style = styles[$scope.fidget.source];
    }

    var styles = {
        boolean: {
            main: {
                get width() { return $scope.fidget.properties.width + "px"; },
                get height() { return $scope.fidget.properties.height + "px"; }
            },
            alert: {
                get color() { return $scope.fidget.properties.fontColor; },
                get 'font-size'() { return $scope.fidget.properties.fontSize; },
                get 'font-family'() { return $scope.fidget.properties.font || 'inherit'; },
            }
        },
        button: {
            get width(){ return $scope.fidget.properties.width + "px"; },
            get 'min-height'() { return $scope.fidget.properties.height + "px"; },
            get 'font-family'() { return $scope.fidget.properties.font || 'inherit'; },
            get 'font-size'() { return $scope.fidget.properties.fontSize + "px"; },
            get fontcolor() { return $scope.fidget.properties.color ? $scope.fidget.properties.color : ''; }
        },
        checkBox: {
            checkmark: {
                get width() { return $scope.fidget.properties.height + "px"; },
                get height() { return $scope.fidget.properties.height + "px"; }
            },
            span: {
                get 'padding-left'() { return ($scope.fidget.properties.height + 10) + "px"; },
                get color() { return $scope.fidget.properties.fontColor; },
                get 'font-size'() { return $scope.fidget.properties.fontSize; },
                get 'font-family'() { return $scope.fidget.properties.font || 'inherit'; },
            },
            checkbox: {
                get width() { return $scope.fidget.properties.width + "px"; },
                get height() { return $scope.fidget.properties.height + "px"; },
                get 'padding-left'() { return "0px !important"; },
            }
        },
        radioButton: {
            scroller: {
                get width() { return $scope.fidget.properties.width + "px"; },
                get height() { return $scope.fidget.properties.height + "px"; }
            },
            checkmark: {
                get width() { return ($scope.fidget.properties.radioSize) + "px"; },
                get height() { return ($scope.fidget.properties.radioSize) + "px"; }
            },
            span: {
                get 'padding-left'() { return ($scope.fidget.properties.radioSize + 10) + "px"; },
                get color() { return $scope.fidget.properties.fontColor; },
                get 'font-size'() { return $scope.fidget.properties.fontSize; },
                get 'font-family'() { return $scope.fidget.properties.font || 'inherit'; },
            },
            checkbox: {
                get width() { return ($scope.fidget.properties.radioSize) + "px"; },
                get height() { return ($scope.fidget.properties.radioSize) + "px"; }
            }
        },
        dropdown: {
            list: {
                get width() { return $scope.fidget.properties.width + "px"; },
                get height() { return $scope.fidget.properties.height + "px"; },
                get color() { return $scope.fidget.properties.fontColor; },
                get 'font-family'() { return $scope.fidget.properties.font || 'inherit'; }, 
                get 'font-size'() { return $scope.fidget.properties.fontSize + "px"; }
            },
            overlayer: {
                get width() { return ($scope.fidget.properties.width - 20) + "px"; },
                get height() { return ($scope.fidget.properties.height - 4) + "px"; },
                get color() { return $scope.fidget.properties.fontColor; },
                get 'font-family'() { return $scope.fidget.properties.font || 'inherit'; },
                get 'font-size'() { return $scope.fidget.properties.fontSize + "px"; }
            }
        },
        text: {
            get width() { return $scope.fidget.properties.width + "px"; },
            get height() { return $scope.fidget.properties.height + "px"; },
            get 'font-family'() { return $scope.fidget.properties.font || 'inherit'; },
            get 'font-size'() { return $scope.fidget.properties.fontSize + "px"; },
            get 'text-align'() { return $scope.fidget.properties.textAlign; },
            get color() { return $scope.fidget.properties.color; },
        },
        textInput: {
            get width() { return $scope.fidget.properties.width + "px"; },
            get height() { return $scope.fidget.properties.height + "px"; },
            get 'font-size'() { return $scope.fidget.properties.type === 'multi' ? '1.0em' : ($scope.fidget.properties.height / 2) + "px"; }
        },
        indicatorLamp: {
            div: {
                get width() { return $scope.fidget.properties.width + "px"; },
                get height() { return $scope.fidget.properties.height + "px"; },
            },
            text: {
                get height() { return indicatorLampSize($scope.fidget) + "px"; },
                get 'line-height'() { return indicatorLampSize($scope.fidget) + "px"; },
                get 'padding-left'() { return (indicatorLampSize($scope.fidget) + 5) + "px"; },
                get color() { return $scope.fidget.properties.color; },
                'white-space': "nowrap"
            },
            lampContainer: {
                get width() { return indicatorLampSize($scope.fidget) + "px"; },
                get height() { return indicatorLampSize($scope.fidget) + "px"; },
                'float': 'left'
            },
            lamp: {
                get 'border-width'() { return indicatorLampSize($scope.fidget) * 0.075 + "px"; }
            },
            bulb: {
                get 'background-color'() {
                    if ([true, 1, 'true', '1'].indexOf($scope.fidget.properties.value) != -1)
                        return $scope.fidget.properties.onColor;

                    if ([false, 0, 'false', '0'].indexOf($scope.fidget.properties.value) != -1)
                        return $scope.fidget.properties.offColor;

                    return "transparent"
                }
            }
        }
    }

}