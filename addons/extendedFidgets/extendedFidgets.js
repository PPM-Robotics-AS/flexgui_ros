extendedFidgetsService.$inject = ['fidgetService', '$rootScope', 'enumService'];

/*

Add extra fidgets to the FidgetBelt

*/

function extendedFidgetsService(fidgetService, $rootScope, enumService) {
    //get camera controller
    $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/controllers/cameraImageController.js", function () {
        //load camera controller to angularjs
        window.lazy.controller("cameraImageCtrl", cameraImageCtrl);

        //add camera controller fidget
        fidgetService.templates.cameraImage = fidgetService.getTemplate($rootScope.addonServerUrl + "addons/extendedFidgets/views/fidgets/",
            "cameraImage", {
                _hidden: false,
                _name: "",
                _text: 'Camera',
                _width: 100,
                _height: 100,
                _source: "",
                scale: 'aspectFit'
            }, enumService.screenTypesEnum.Normal,
            $rootScope.addonServerUrl + "addons/extendedFidgets/", "images/fidgets/cameraImage.png");

        //reset templates, if there were any not available
        fidgetService.reCheckTemplate();
    });

    $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/controllers/slamMapController.js", function () {
        //load shape controller to angularjs
        window.lazy.controller("slamMapCtrl", slamMapCtrl);

        //add localization
        angular.forEach(Object.keys(localization.items), function (key) {
            localization.items[key].fidgets.slam = "SLAM";
            localization.items[key].fidgets.properties._isCalibrationOn = "Calibration mode";
            localization.items[key].fidgets.properties._zoom = "Zoom";
            localization.items[key].fidgets.properties._hpan = "Horizontal pan";
            localization.items[key].fidgets.properties._vpan = "Vertical pan";
            localization.items[key].fidgets.properties._destinationTopicName = "Destination topic";
            localization.items[key].fidgets.properties._positionTopicName = "Current position topic";
            localization.items[key].fidgets.properties.calibrationPoints = "Calibration points";
        });

        //add shape fidget
        fidgetService.templates.slam = fidgetService.getTemplate(
            $rootScope.addonServerUrl + "addons/extendedFidgets/views/fidgets/", "slam",
                {
                    _hidden: false,
                    _name: "",
                    _width: 200,
                    _height: 200,
                    _angle: 0,
                    _zoom: 1,
                    _hpan: 0,
                    _vpan: 0,
                    _destinationTopicName: "slam/destinationPosition",
                    _positionTopicName: "slam/currentPosition",
                    _isCalibrationOn: false,
                    calibrationPoints: "[]"
                }, enumService.screenTypesEnum.All, $rootScope.addonServerUrl + "addons/extendedFidgets/", "images/fidgets/slam.png"),

        //reset templates, if there were any not available
        fidgetService.reCheckTemplate();
    });

    $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/3rdParty/3dViewer/three.js", function () {
        $.when(
                $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/controllers/3dViewerController.js"),
                $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/3rdParty/3dViewer/ColladaLoader.js"),
                $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/3rdParty/3dViewer/STLLoader.js"),
                $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/3rdParty/3dViewer/ColladaLoader2.js"),
                $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/3rdParty/3dViewer/ros3d.min.js")
                   ).done(function () {

                       //add localization
                       angular.forEach(Object.keys(localization.items), function (key) {
                           localization.items[key].fidgets.properties._fixedFrame = "Fixed frame";
                           localization.items[key].fidgets.properties._namespace = "Robot desc. namespace";
                           localization.items[key].fidgets.properties._markerArray = "Marker array topic";
                           localization.items[key].fidgets.threeDViewer = "3D";
                       });

                       //load controllers to angularjs
                       window.lazy.controller("3dController", ThreeDViewerController);


                       //add fidgets
                       fidgetService.templates.threeDViewer = fidgetService.getTemplate(
                           $rootScope.addonServerUrl + "addons/extendedFidgets/views/fidgets/",
                           "threeDViewer",
                           { _hidden: false, _name: "", _width: 640, _height: 480, _source: "", _markerArray: "", _fixedFrame: '/base_link', _namespace: '' },
                           enumService.screenTypesEnum.Normal, $rootScope.addonServerUrl + "addons/extendedFidgets/", "images/fidgets/3d.png");

                       //reset templates, if there were any not available
                       fidgetService.reCheckTemplate();

                   }).fail(function (a, b, c) { console.log("[EXTENDED FIDGETS] Error: ", c, a, b) });
    });

    $.getScript($rootScope.addonServerUrl + "addons/extendedFidgets/scripts/controllers/shapeController.js", function () {
        //load shape controller to angularjs
        window.lazy.controller("shapeCtrl", shapeCtrl);

        //add localization
        angular.forEach(Object.keys(localization.items), function (key) {
            localization.items[key].fidgets.shape = "Shape";
            localization.items[key].fidgets.properties._shape = "Shape";
            localization.items[key].fidgets.properties._stroke = "Stroke";
            localization.items[key].fidgets.shapes = {
                circle: "Circle",
                ellipse: "Ellipse",
                rectangle: "Rectangle",
                triangle_isosceles: "Triangle (isosceles)",
                triangle_rectangular: "Triangle (rectangular)",
                star: "Star",
                pentagon: "Pentagon",
                hexagon: "Hexagon",
                octagon: "Octagon",
                trapezoid: "Trapezoid",
                arrow: "Arrow",
                arrow_long: "Arrow (long)",
                arrow_head: "Arrow (head)",
                arrow_cursor: "Arrow (cursor)",
                plus: "Plus",
                heart: "Heart",
                wrench: "Wrench",
                rabbit: "Rabbit",
                fish: "Fish",
            };
        });

        //add shape fidget
        fidgetService.templates.shape = fidgetService.getTemplate(
            $rootScope.addonServerUrl + "addons/extendedFidgets/views/fidgets/", "shape",
                {
                    _angle: 0,
                    _text: "",
                    _hidden: false,
                    _name: "",
                    _color: "#000000",
                    _borderColor: "#ffffff",
                    _shape: "circle",
                    _width: 200,
                    _height: 200,
                    _stroke: 2
                }, enumService.screenTypesEnum.All, $rootScope.addonServerUrl + "addons/extendedFidgets/", "images/fidgets/shape.png"),

        fidgetService.templates.shape.editors["_shape"] = $rootScope.addonServerUrl + "addons/extendedFidgets/views/fidgets/shapes/propertySelector.html";

        //reset templates, if there were any not available
        fidgetService.reCheckTemplate();
    });

    return {};
}