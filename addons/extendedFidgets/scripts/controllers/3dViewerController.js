ThreeDViewerController.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService', 'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService', '$timeout'];

function ThreeDViewerController($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService, popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService, $timeout) {
    $scope.init = function () {
        $timeout(function () {
            // Create the main viewer.
            var viewer = new ROS3D.Viewer({
                divID: 'urdf_' + $scope.fidget.id,
                width: $scope.fidget.properties.width,
                height: $scope.fidget.properties.height,
                antialias: true
            });

            // Add a grid.
            viewer.addObject(new ROS3D.Grid());

            $scope.$watchGroup([
                function () { return $scope.fidget.properties.width; },
                function () { return $scope.fidget.properties.height; }], function () {

                    viewer.resize($scope.fidget.properties.width, $scope.fidget.properties.height);

                });

            $scope.$watchGroup([
                function () { return deviceService.connected; },
                function () { return $scope.fidget.properties.namespace; },
                function () { return variableService.ros; },
                function () { return $scope.fidget.properties.source; }], function () {
                    if (deviceService.connected && variableService.ros && $scope.fidget.properties.source) {

                        var request;
                        if (window.XMLHttpRequest)
                            request = new XMLHttpRequest();
                        else
                            request = new ActiveXObject("Microsoft.XMLHTTP");
                        request.open('GET', $scope.fidget.properties.source, false);
                        try {
                            request.send(); // there will be a 'pause' here until the response to come.
                            // the object request will be actually modified
                            if (request.status !== 404) {
                                // Setup a client to listen to TFs.
                                var tfClient = new ROSLIB.TFClient({
                                    ros: variableService.ros,
                                    angularThres: 0.01,
                                    transThres: 0.01,
                                    rate: 10.0,
                                    fixedFrame: $scope.fidget.properties.fixedFrame,
                                    serverName: $scope.fidget.properties.namespace ? '/' + $scope.fidget.properties.namespace + '/tf2_web_republisher' : null
                                });

                                // Setup the URDF client.
                                var urdfClient = new ROS3D.UrdfClient({
                                    ros: variableService.ros,
                                    tfClient: tfClient,
                                    path: $scope.fidget.properties.source,
                                    rootObject: viewer.scene,
                                    loader: ROS3D.COLLADA_LOADER_2,
                                    param: $scope.fidget.properties.namespace ? '/' + $scope.fidget.properties.namespace + '/robot_description' : null
                                });

                                if ($scope.fidget.properties.markerArray) {
                                    arrays = $scope.fidget.properties.markerArray.split(',');
                                    arrays.forEach(function(element) { 
                                        new ROS3D.MarkerArrayClient({
                                            ros: variableService.ros,
                                            tfClient: tfClient,
                                            topic: element,
                                            rootObject: viewer.scene
                                        });
                                    });
                                }
                            }
                        } catch (e) { }
                        
                    }
                });


        }, 200);
    }
}