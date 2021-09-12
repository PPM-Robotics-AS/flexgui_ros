imageCtrl.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService',
    'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService',
    '$timeout', '$rootScope', 'imageService', 'colorPickerService'];

function imageCtrl($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService,
    popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService,
    $timeout, $rootScope, imageService, colorPickerService) {

    var imageResizeTimer = null;
    var watch;

    hashCode = function (s) {
        return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    }

    $scope.initImage = function () {
        if (watch) watch();

        watch = $scope.$watchGroup([
            function () { return $scope.fidget.properties.width },
            function () { return $scope.fidget.properties.height },
            function () { return $scope.fidget.properties.value }], function () {

                function resize() {
                    function imageToDataUri(img, maxWidth, maxHeight) {

                        var cached = _.find(imageService.cache, function (i) {
                            return i.key == hashCode($scope.fidget.properties.value) && i.maxHeight == maxHeight && i.maxWidth == maxWidth;
                        });

                        if (cached) {
                            console.log(cached.key);
                            $scope.imageUrl = cached.url;
                            $scope.$apply();
                            return
                        }

                        var ratio = 0;  // Used for aspect ratio
                        var width = img.width;    // Current image width
                        var height = img.height;  // Current image height
                        var needDownScale = false;
                        // create an off-screen canvas
                        var canvas = document.createElement('canvas'),
                            ctx = canvas.getContext('2d');

                        // Check if the current width is larger than the max
                        if (width > maxWidth) {
                            ratio = maxWidth / width;   // get ratio for scaling image
                            canvas.width = maxWidth; // Set new width
                            canvas.height = height * ratio;  // Scale height based on ratio
                            height = height * ratio;    // Reset height to match scaled image
                            width = width * ratio;    // Reset width to match scaled image
                            needDownScale = true;
                        } else if (height > maxHeight) {
                            // Check if current height is larger than max
                            ratio = maxHeight / height; // get ratio for scaling image
                            canvas.height = maxHeight;   // Set new height
                            canvas.width = width * ratio;    // Scale width based on ratio
                            width = width * ratio;    // Reset width to match scaled image
                            height = height * ratio;    // Reset height to match scaled image
                            needDownScale = true;
                        }

                        var url;
                        if (needDownScale) {
                            // draw source image into the off-screen canvas:
                            ctx.drawImage(img, 0, 0, width, height);
                            // encode image to data-uri with base64 version of compressed image
                            try {
                                url = canvas.toDataURL();
                            }
                            catch (e) {
                                //fallback if cant resize
                                url = $scope.fidget.properties.value;
                            }
                        } else {
                            //the image is smaller then the desired size, so we can keep the actual base64
                            url = $scope.fidget.properties.value;
                        }

                        $scope.imageUrl = url;
                        $scope.$apply();

                        /*imageService.cache.push({
                            key: hashCode($scope.fidget.properties.value),
                            maxWidth: maxWidth,
                            maxHeight: maxHeight,
                            url: url
                        });*/
                    }

                    var img = new Image;
                    img.onload = function () {
                        imageToDataUri(img, $scope.fidget.properties.width, $scope.fidget.properties.height)
                    };
                    img.src = $scope.fidget.properties.value;
                }

                if (!$scope.imageUrl) {
                    //generate asap
                    resize();
                } else {
                    //generate at the end of the loop
                    if (imageResizeTimer) {
                        $timeout.cancel(imageResizeTimer);
                        imageResizeTimer = null;
                    }

                    imageResizeTimer = $timeout(function () {
                        resize();
                    }, 200);
                }
            });

        $scope.style = styles.image;
    }

    //reset fidget to be able to watch
    $scope.$watch(function () { return projectService.loaded }, function () {
        $scope.initImage(projectService.getFidgetById($scope.fidget.id));
    });

    var styles = {
        image: {
            div: {
                get height() { return ($scope.size ? $scope.size.height : 0)+ "px"; },
                get width() { return ($scope.size ? $scope.size.width : 0) + "px"; },
            },
            imageContainer: {
                get display() { return "table-cell"; },
                get 'vertical-align'() { return "middle"; }, 
                get 'text-align'() { return "center"; },
                get height() { return $scope.fidget.properties.height + "px"; },
                get 'min-width'() { return $scope.fidget.properties.width + "px"; },
                get 'max-width'() { return $scope.fidget.properties.width + "px"; },
                get transform() {
                    var center = { x: $scope.fidget.properties.width, y: $scope.fidget.properties.height };
                    if ($scope.center) {
                        center = $scope.center;
                    }
                    return "translate(" + -center.x + "px, " + -center.y + "px) rotate(" + $scope.fidget.properties.angle + "deg)"; }
            },
            image: {
                get "background-position"() { return "center"; },
                get "background-repeat"() { return "no-repeat"; },
                get height() { return "100%"; },
                get width() { return "100%"; },
                get 'background-image'() { return "url(" + $scope.imageUrl + ")"; }
            }
        }
    }

}