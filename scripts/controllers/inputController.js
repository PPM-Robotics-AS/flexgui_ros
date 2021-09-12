inputCtrl.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService',
    'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService',
    '$timeout', '$rootScope'];

function inputCtrl($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService,
    popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService,
    $timeout, $rootScope) {

    //current fidget
    var tempValue;
    var editTimeout;

    //hold reference to watchers to be able to remove when it is necesarry
    $scope.initInput = function (f) {
        fidget = f;
        if (editTimeout){
            $timeout.cancel(editTimeout);
            editTimeout = null;
        }

        Object.defineProperty($scope, "value", {
            get: function() { 
                if (editTimeout) {
                    return tempValue;
                }

                return $scope.fidget.properties.text;
            },
            set: function (value) {
                tempValue = value;

                if (editTimeout){
                    $timeout.cancel(editTimeout);
                    editTimeout = null;
                }

                editTimeout = $timeout(function(){
                    $scope.fidget.properties.text = tempValue;
                    editTimeout = null;
                }, 400);
            },
            enumerable: true,
            configurable: true
        });
    }
}