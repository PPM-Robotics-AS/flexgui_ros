cameraImageCtrl.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService', 'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService', '$timeout'];

function cameraImageCtrl($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService, popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService, $timeout) {
    var context, canvas, img, updateTimeout, retryTimeout;

    //prevent caching by adding timestamp to the URL
    function getCameraUrl() {
        $scope.cameraUrl = $scope.fidget.properties.source + "?ts=" + Date.now();
    }

    $scope.connected = false;
    $scope.loggedInUrl = null;
    $scope.enabled = true;
    
    $scope.$on("$destroy", function () {
        $scope.deleted = true;
    });

    function retry() {
        if (retryTimeout) {
            $timeout.cancel(retryTimeout);
        }

        retryTimeout = $timeout($scope.startCamera, 2000);
    }

    //start camera update
    $scope.startCamera = function () {
        if ($scope.deleted) return;

        if (updateTimeout) {
            $timeout.cancel(updateTimeout);
        }

        $scope.enabled = true;
        updateTimeout = $timeout(function () { try { updateFrame(); } catch (e) { console.log("Camera error", e); $scope.connected = false; retry(); } }, 100);
    }

    //stop camera
    $scope.stopCamera = function () {
        $scope.enabled = false;
        $scope.connected = false;
    }

    function checkUrlAvailable(url, callback){
        // try to load favicon
        var timer = window.setTimeout(function(){
            // timeout after 5 seconds
            callback(false);
        },5000)
        
        var img = new Image();
        img.onload = function() {
            window.clearTimeout(timer);
            callback(true);
        }
        
        img.onerror = function() {
            window.clearTimeout(timer);
            callback(false);
        }

        img.src = url;
    }

    //camera image initalizer
    $scope.initCameraImage = function () {

        $timeout(function () {
            canvas = document.getElementById("player_" + $scope.fidget.id);
            context = canvas.getContext("2d");

            $scope.$watch(function () { return $scope.fidget.properties.source; }, function () {
                checkUrlAvailable($scope.fidget.properties.source, function(res){
                    if (res){
                        img = new Image();
                        img.onload = $scope.startCamera();
                        img.src = $scope.fidget.properties.source;
                    } else {
                        $scope.stopCamera();
                        $timeout.cancel(retryTimeout);
                    }
                })
            });

            $scope.$watchGroup([
                function () { return $scope.fidget.properties.width; },
                function () { return $scope.fidget.properties.height; },
                function () { return $scope.fidget.properties.source; },
                function () { return $scope.fidget.properties.scale; }
            ], function () {
                //setup the canvas's size
                canvas.width = $scope.fidget.properties.width;
                canvas.height = $scope.fidget.properties.height;
                canvas.style.width = $scope.fidget.properties.width + 'px';
                canvas.style.height = $scope.fidget.properties.height + 'px';
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

        }, 1000);
    }

    //get camera rect
    function scaleRect(srcSize, dstSize) {
        var ratio = Math.min(dstSize.width / srcSize.width,
                             dstSize.height / srcSize.height);
        var newRect = {
            x: 0, y: 0,
            width: srcSize.width * ratio,
            height: srcSize.height * ratio
        };
        newRect.x = (dstSize.width / 2) - (newRect.width / 2);
        newRect.y = (dstSize.height / 2) - (newRect.height / 2);
        return newRect;
    }

    //update camera frame
    function updateFrame() {
        var canvas = context.canvas;
        var drawReady = false;
        if ($scope.fidget.properties.scale == 'stretch') {
            try {
                context.drawImage(img,
                  0,
                  0,
                  img.width,
                  img.height,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

                drawReady = true;
            } catch (e) {
                // if we can't draw, don't bother updating anymore
                $scope.stopCamera();
                throw e;
            }
        } else {
            var hRatio = canvas.width / img.width;
            var vRatio = canvas.height / img.height;
            var ratio = $scope.fidget.properties.scale == "aspectFit" ? Math.min(hRatio, vRatio) : Math.max(hRatio, vRatio);
            var centerShift_x = (canvas.width - img.width * ratio) / 2;
            var centerShift_y = (canvas.height - img.height * ratio) / 2;
            try {
                context.drawImage(img, 0, 0, img.width, img.height,
                               centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

                drawReady = true;
            } catch (e) {
                // if we can't draw, don't bother updating anymore
                $scope.stopCamera();
                throw e;
            }
        }

        if (drawReady && $scope.enabled) {
            $scope.connected = true;
            $scope.startCamera()
        }
    }
}