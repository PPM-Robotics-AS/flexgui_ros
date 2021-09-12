﻿propertiesWindowCtrl.$inject = ['$scope', '$rootScope', '$window', '$location', '$routeParams', 'projectService', 'deviceService', 'editorService', 'colorPickerService', 'scriptManagerService', 'variableService', 'enumService', 'backgroundService', 'projectStorageService', 'fidgetService'];

function propertiesWindowCtrl($scope, $rootScope, $window, $location, $routeParams, projectService, deviceService, editorService, colorPickerService, scriptManagerService, variableService, enumService, backgroundService, projectStorageService, fidgetService) {
    var invalidScripts = {};

    //returns if any of the property is an invalid script, used for disabling the save of the properties
    $scope.hasInvalidScript = function () {
        return Object.keys(invalidScripts).length > 0;
    }

    if (!$rootScope.onClickEditor) $rootScope.onClickEditor = 'views/properties/onClick.html';

    //duplicate screen, copies all of the properties of screen and add " - Screen" tag after the name
    $scope.duplicateScreen = function () {
        //create a copy of the current screen
        var copy = angular.copy(projectService.currentScreen);
        var exists = true;
        var id = "";

        while (exists) {
            exists = false;
            angular.forEach(projectService.screens, function (screen) {
                if (screen.properties.name == projectService.currentScreen.properties.name + " - Copy" + (id == "" ? id : (" " + id))) {
                    exists = true;
                    if (id == "")
                        id = 2;
                    else
                        id++;
                }
            });
        }

        //update the name
        copy.properties.name += " - Copy" + (id == "" ? id : (" " + id));
        copy.id = projectService.getId();

        //add to screen list
        projectService.screens.push(copy);

        //setup fidgets, generate new id for fidgets
        projectService.setupContainer(copy, 1, function (f) { f.id = "fidget_" + variableService.guid(); });

        //open screen editor window
        $rootScope.editScreen(copy);
    }

    //validates of the value of a property, unValidatedPropertes to be extended, if we want to exclude something from the validated prop list
    $scope.validate = function (error, fidget, property) {
        var validateProperties = ["_width", "_height", "_value", "_min", "_max", "_angleArc", "_angleOffset", "_precision", "_step", "_lock", "_blinking", "_blinkFrequency", "_borderWidth", "_top", "_left"];

        if (fidget == projectService.currentScreen) {
            var existing = false;
            angular.forEach(projectService.screens, function (screen) {
                if (screen != projectService.currentScreen && screen.properties.name == projectService.currentScreen.properties.name) {
                    existing = true;
                }
            });

            if (existing) {
                invalidScripts["projectName"] = "";
            } else {
                delete invalidScripts["projectName"];
            }
        }

        function error(property) {
            error.scriptError = true;
            invalidScripts[property] = "";
        }

        if (validateProperties.indexOf(property) >= 0) {
            try {
                var value = fidget.properties[property];
                if (value === undefined || value === null || value === "") {
                    error(property);
                    return;
                } else {
                    var sizeAndPos = ["_height", "_width", "_top", "_left"];
                    if (sizeAndPos.indexOf(property) > -1 && value.toString().indexOf("%") > -1) {
                        //do not eval if contains % but we can assume it is ok
                        var x = fidgetService.calculateSizeAndPosProperty(fidget, property, value, sizeAndPos);
                        delete invalidScripts[property];
                    } else {
                        eval(scriptManagerService.compile(value));
                        delete invalidScripts[property];
                    }
                }
            }
            catch (e) {
                error(property);
                return;
            }
        }

        error.scriptError = false;
    }

    //open a color picker
    $scope.openColorPicker = function (prop, value) {
        colorPickerService.onColorSelected = function () {
            editorService.editedFidget.properties[prop] = colorPickerService.selectedColor;
            colorPickerService.showColorPicker(false);
        };

        colorPickerService.selectedColor = value;
        colorPickerService.showColorPicker(true);
    }

    //open color picker for background
    $scope.openBackgroundColorPicker = function (value) {
        colorPickerService.onColorSelected = function () {
            editorService.editedFidget.backgroundColor = colorPickerService.selectedColor;
            colorPickerService.showColorPicker(false);
        };

        colorPickerService.selectedColor = value;
        colorPickerService.showColorPicker(true);
    }

    //generate background
    //generates a base64 background from a color
    $scope.generateBackground = function () {
        var image = colorPickerService.generateBase64Color(editorService.editedFidget.backgroundColor);
    }

    if (editorService.editedFidget == projectService.currentScreen) {
        $scope.$watch(function () { return editorService.editedFidget.backgroundType }, function (nv, ov) {
            if (!nv || !backgroundService.backgroundTypes[editorService.editedFidget.backgroundType.name]) {
                editorService.editedFidget.backgroundType = backgroundService.backgroundTypes.Color;
                editorService.editedFidget.backgroundColor = null;
            }
        });

        $scope.$watch(function () { return editorService.editedFidget.backgroundColor }, function () {
            if (editorService.editedFidget.backgroundType && editorService.editedFidget.backgroundType.key == backgroundService.backgroundTypes.Color.key) {
                if (editorService.editedFidget.backgroundColor) editorService.editedFidget.backgroundImage = colorPickerService.generateBase64Color(editorService.editedFidget.backgroundColor);
                else editorService.editedFidget.backgroundImage = null;
            }
        });
    }

    //init color picker to pick color for a factory screen background
    //for this we have to convert the color the a base64 image and back (to show which is selected)
    $scope.colorPickerInitForFactory = function () {
        if (editorService.editedFidget.id != projectService.currentScreen.id) return;

        var image = new Image();
        image.onload = function () {

            function rgb2hex(r, g, b) {
                return "#" +
                 ("0" + parseInt(red, 10).toString(16)).slice(-2) +
                 ("0" + parseInt(green, 10).toString(16)).slice(-2) +
                 ("0" + parseInt(blue, 10).toString(16)).slice(-2);
            }

            var canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;

            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);

            var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            var index = (0 * imageData.width + 0) * 4;
            var red = imageData.data[index];
            var green = imageData.data[index + 1];
            var blue = imageData.data[index + 2];
            var alpha = imageData.data[index + 3];

            //colorPickerService.selectedColor = rgb2hex(red, green, blue).toUpperCase();

            editorService.editedFidget.backgroundColor = rgb2hex(red, green, blue).toUpperCase();
        };
        image.src = editorService.editedFidget.backgroundImage;
    }

    

    //returns with the fidget properties (setted up in fidgetTemplate.js)
    $scope.getFidgetProperties = function () {
        var result = Array();
        if (projectService.currentScreen == editorService.editedFidget) {

            //if a fidget is a screen, go through the properties
            for (var p in editorService.editedFidget.properties)
                result.push(p);
        } else {
            //if a fidget, get the properties from the template (and keep the order)
            for (var p in editorService.editedFidget.template.properties)
                result.push(p);
        }
        var result = result.sort();
        //move onclick to the end of the list and width next to height
        if (result.indexOf("_height") > -1 && result.indexOf("_width") > -1) result.move(result.indexOf("_height"), result.indexOf("_width"));
        if (result.indexOf("_top") > -1 && result.indexOf("_left") > -1) result.move(result.indexOf("_top"), result.indexOf("_left"));
        if (result.indexOf("onClick") > -1) result.move(result.indexOf("onClick"), result.length - 1);
        return result;
    }

    $scope.enableField = function (p) {
        if (editorService.editedFidget.template.properties[p] == editorService.mepuv) {
            editorService.editedFidget.template.properties[p] = "";
        }
    }

    //removes a screen from the project
    $scope.removeScreen = function () {
        projectService.screens.splice(projectService.screens.indexOf(projectService.currentScreen), 1);
        if (projectService.screens.length > 0) {
            projectService.setCurrentScreenIndex(0);
        } else {

        }
        editorService.setPropertiesWindowVisible(false);
        projectStorageService.save(true);
    }

    //moves a screen up or down in the screenbelt
    $scope.moveScreen = function (d) {
        var s = projectService.currentScreen;
        var index = projectService.screens.indexOf(s);
        projectService.screens.splice(index, 1);
        projectService.screens.splice(index + d, 0, s);
        projectService.setCurrentScreenIndex(projectService.currentScreenIndex + d);
        projectStorageService.save(true);
    }

    //enum for the fidget's position on the layer
    $scope.moveTo = {
        backOne: function () { return -1; },
        forwardOne: function () { return 1; },
        toBack: function () { return -editorService.editedFidget.parent.fidgets.indexOf(editorService.editedFidget); },
        toFront: function () { return editorService.editedFidget.parent.fidgets.length - editorService.editedFidget.parent.fidgets.indexOf(editorService.editedFidget); },
    }

    //moves a screen up or down in the screenbelt
    $scope.moveFidget = function (d) {
        var f = editorService.editedFidget;
        var index = f.parent.fidgets.indexOf(f);
        f.parent.fidgets.splice(index, 1);
        f.parent.fidgets.splice(index + d, 0, f);
        projectStorageService.save(true);
    }

    //returns true if a property is required
    $scope.isPropertyRequired = function (p) {
        return p == 'name' || p == 'width' || p == 'height';
    }

    //remove background
    $scope.clearBackground = function () {
        projectService.currentScreen.backgroundImage = null;
    }
}
