shapeCtrl.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService', 'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService', '$timeout', '$rootScope'];

function shapeCtrl($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService, popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService, $timeout, $rootScope) {
    $scope.shapeHtml = null;

    $scope.initShapeFidget = function () {

        function reloadHtml () {
        	//	Get a common shape or a polygon
        	var file = $scope.fidget.properties.shape;
        	switch ($scope.fidget.properties.shape) {
        		case "triangle_isosceles":
        		case "triangle_rectangular":
        		case "star":
        		case "pentagon":
        		case "hexagon":
        		case "octagon":
        		case "trapezoid":
        		case "arrow":
        		case "arrow_long":
        		case "arrow_head":
        		case "arrow_cursor":
        		case "plus":
        			file = "polygon";
        			break;
        		case "heart":
        	    case "wrench":
        		case "rabbit":
        		case "fish":
        			file = "path";
        			break;
        		default:
        			file = $scope.fidget.properties.shape;
        			break;
        	}

        	//	Generate point array for polygonal shapes
        	$scope.fidget.polyPoints = [];
        	if (file == "polygon") {
        		//	Polygon shape samples (you just need to copy the sample's coordinates in the following format, the rest is calculated)
        		var polyShapes = {
        			triangle_isosceles: {
        				points: [
							{ x: 0, y: 2 },
							{ x: 1, y: 0 },
							{ x: 2, y: 2 }]
        			},
        			triangle_rectangular: {
        				points: [
							{ x: 0, y: 0 },
							{ x: 0, y: 1 },
							{ x: 1, y: 1 }]
        			},
        			star: {
        				points: [
							{ x: 150, y: 25 },
							{ x: 179, y: 111 },
							{ x: 269, y: 111 },
							{ x: 197, y: 165 },
							{ x: 223, y: 251 },
							{ x: 150, y: 200 },
							{ x: 77, y: 251 },
							{ x: 103, y: 165 },
							{ x: 31, y: 111 },
							{ x: 121, y: 111 }]
        			},
        			pentagon: {
        				points: [
							{ x: 294, y: 3 },
							{ x: 585.246118, y: 214.602691 },
							{ x: 474, y: 556.983037 },
							{ x: 114, y: 556.983037 },
							{ x: 2.753882, y: 214.602691 }
        				]
        			},
        			hexagon: {
        				points: [
							{ x: 723, y: 314 },
							{ x: 543, y: 625.769145 },
							{ x: 183, y: 625.769145 },
							{ x: 3, y: 314 },
							{ x: 183, y: 2.230855 },
							{ x: 543, y: 2.230855 }
        				]
        			},
        			octagon: {
        				points: [
							{ x: 136.737609507049, y: 188.692435121084 },
							{ x: 63.2623904929514, y: 188.692435121084 },
							{ x: 11.3075648789165, y: 136.737609507049 },
							{ x: 11.3075648789165, y: 63.2623904929514 },
							{ x: 63.2623904929513, y: 11.3075648789165 },
							{ x: 136.737609507049, y: 11.3075648789165 },
							{ x: 188.692435121084, y: 63.2623904929513 },
							{ x: 188.692435121084, y: 136.737609507049 }
        				]
        			},
        			trapezoid: {
        				points: [
							{ x: 0, y: 2 },
							{ x: 4, y: 2 },
							{ x: 3, y: 0 },
							{ x: 1, y: 0 }
        				]
        			},
        			arrow: {
        				points: [
							{ x: 10, y: 0 },
							{ x: 20, y: 10 },
							{ x: 10, y: 20 },
							{ x: 10, y: 15 },
							{ x: 0, y: 15 },
							{ x: 0, y: 5 },
							{ x: 10, y: 5 }
        				]
        			},
        			arrow_long: {
        				points: [
							{ x: 30, y: 0 },
							{ x: 40, y: 10 },
							{ x: 30, y: 20 },
							{ x: 30, y: 15 },
							{ x: 0, y: 15 },
							{ x: 0, y: 5 },
							{ x: 30, y: 5 }
        				]
        			},
        			arrow_head: {
        				points: [
							{ x: 0, y: 1 },
							{ x: 1, y: 0 },
							{ x: 4, y: 3 },
							{ x: 1, y: 6 },
							{ x: 0, y: 5 },
							{ x: 2, y: 3 }
        				]
        			},
        			arrow_cursor: {
        				points: [
							{ x: 0, y: 1 },
							{ x: 16, y: 8 },
							{ x: 0, y: 15 },
							{ x: 3, y: 8 }
        				]
        			},
        			plus: {
        				points: [
							{ x: 3, y: 0 },
							{ x: 5, y: 0 },
							{ x: 5, y: 3 },
							{ x: 8, y: 3 },
							{ x: 8, y: 5 },
							{ x: 5, y: 5 },
							{ x: 5, y: 8 },
							{ x: 3, y: 8 },
							{ x: 3, y: 5 },
							{ x: 0, y: 5 },
							{ x: 0, y: 3 },
							{ x: 3, y: 3 }
        				]
        			}
        		}
        		//	Calculate real coordinates based on samples
        		var oLeft = 1000000;
        		var oTop = 1000000;
        		var oWidth = -1000000;
        		var oHeight = -1000000;
        		for (var i = 0; i < polyShapes[$scope.fidget.properties.shape].points.length; i++) {
        			oLeft = polyShapes[$scope.fidget.properties.shape].points[i].x < oLeft ? polyShapes[$scope.fidget.properties.shape].points[i].x : oLeft;
        			oTop = polyShapes[$scope.fidget.properties.shape].points[i].y < oTop ? polyShapes[$scope.fidget.properties.shape].points[i].y : oTop;
        			oWidth = polyShapes[$scope.fidget.properties.shape].points[i].x > oWidth ? polyShapes[$scope.fidget.properties.shape].points[i].x : oWidth;
        			oHeight = polyShapes[$scope.fidget.properties.shape].points[i].y > oHeight ? polyShapes[$scope.fidget.properties.shape].points[i].y : oHeight;
        		}
        		oWidth -= oLeft;
        		oHeight -= oTop;
        		for (var i = 0; i < polyShapes[$scope.fidget.properties.shape].points.length; i++) {
        			var newx = $scope.fidget.properties.stroke / 2 + (polyShapes[$scope.fidget.properties.shape].points[i].x - oLeft) * ($scope.fidget.properties.width - $scope.fidget.properties.stroke) / oWidth;
        			var newy = $scope.fidget.properties.stroke / 2 + (polyShapes[$scope.fidget.properties.shape].points[i].y - oTop) * ($scope.fidget.properties.height - $scope.fidget.properties.stroke) / oHeight;
        			$scope.fidget.polyPoints[i] = newx + "," + newy;
        		}
        	}

        	//	Generate path for curved shapes
        	$scope.fidget.path = "";
        	if (file == "path") {
        		//	Path shape samples (you just need to copy the sample's d argument as string, the rest is calculated)
        		//		To get more shape paths, visit: http://editor.method.ac/
				//		To get scaleX and scaleY, set them to 0,0 as default, load FlexGui, put this shape on screen, set Stroke to 0, set Width,Height to fit the image perfectly and check the console log
        		var pathShapes = {
        			heart: {
        				path: "m245.56776,114.78378c64.9365,-154.75042 319.35982,0 0,198.96483c-319.35982,-198.96483 -64.9365,-353.71525 0,-198.96483z",
        				scale: {
        					x: 1.5499758235084176,
        					y: 2.384484643078836
        				}
        			},
        			wrench: {
        				path: "m343.98708,199.20554c18.91197,-20.09504 22.71339,-47.51786 12.4253,-70.58025l-37.96738,40.91807l-37.4265,-6.72487l-12.40123,-33.31879l37.87135,-40.82304c-26.05014,-6.05691 -54.74946,1.25539 -73.57812,21.27092c-19.85718,21.10125 -23.10683,50.32237 -10.81626,74.03038l-98.96538,105.17673c-10.53041,11.18213 -9.24754,28.14204 2.85211,37.87019c12.09964,9.7213 30.44736,8.54635 40.97412,-2.6359l98.84944,-105.07297c27.2103,8.10533 58.2335,1.08674 78.18256,-20.11046l-0.00001,-0.00001z",
        				scale: {
        					x: 4.5672541819426336,
        					y: 4.0257740906889845
        				}
        			},
        			rabbit: {
        				path: "m70.53302,317.69884c-9.59219,-5.11541 2.92488,-15.34284 7.66376,-19.86698c3.19204,-3.48417 -18.29379,0.48875 -9.22266,-11.60621c9.95235,-9.88093 6.19288,-26.59727 -3.75517,-34.36765c-13.69058,-10.93186 -31.25648,-20.288 -36.31429,-40.70076c-5.11419,-12.7142 7.0142,-26.10485 -0.78672,-37.5861c-6.27904,-14.9072 1.05666,-30.45228 5.61633,-44.26148c2.09688,-19.10223 -10.74822,-34.20846 -17.81222,-49.90199c-8.74685,-14.9971 -13.78893,-32.47217 -14.51347,-50.68327c-1.90221,-7.77327 0.2029,-19.84494 7.79878,-9.36501c15.9069,15.06268 33.37,29.35535 44.50296,49.97252c2.10735,7.44709 10.5456,29.03089 11.0168,9.48553c0.22069,-26.86373 7.15872,-56.16265 24.93689,-74.16476c12.0924,-13.03037 18.61379,9.78528 19.17801,21.37933c3.14743,22.81222 -2.06981,45.43425 -7.88364,66.98349c-2.13431,10.01462 -7.69261,37.45835 8.15972,27.33938c36.51809,-16.67309 80.76246,0.83814 104.54877,36.65547c10.93436,17.34231 15.72291,39.62314 15.6148,61.01649c-5.63034,12.5685 15.28939,-0.23545 7.70909,14.26481c-4.46244,16.06283 -17.07058,24.77871 -25.90221,36.90284c-8.98691,9.71523 -2.31889,30.48682 -17.18064,33.54749c-21.68509,7.90554 -44.45623,11.36846 -67.03117,13.38412c-12.63287,3.06067 -18.76367,-14.02216 -6.65551,-21.12393c5.80498,-10.58277 22.41287,-11.32439 27.34741,-13.00089c-11.79192,1.36442 -26.3343,-4.32728 -36.27074,4.30904c-6.01763,11.55249 -10.83722,26.75808 -23.45625,30.05551c-5.67097,1.86259 -11.50173,3.35626 -17.30864,1.33302l-0.00001,0.00001z",
        				scale: {
        					x: 3.5953428226514355,
        					y: 4.314717081978411
        				}
        			},
					//	This shape is "in the middle" of the bounding box. That is because not all points are visible (like bezier's target) and I didn't want to calculate "visible splines" in the script...
        			fish: {
        				path: "m106.60026,193.92313c0.92597,-10.54818 3.09663,-21.44643 7.94151,-30.49787c4.62982,-5.94419 12.10245,-5.76646 18.34334,-7.80005c-8.74433,-2.51676 -16.90677,-6.97295 -24.91562,-11.6879c-13.10897,-6.10699 -26.45251,2.69228 -38.26873,8.86546c-8.77329,4.49938 -17.45171,9.80745 -26.89872,12.03548c-6.19712,-4.62133 -1.0215,-17.73215 3.33631,-23.26793c5.51752,-7.64505 13.68475,-11.59467 19.66636,-18.57582c2.63142,-9.86065 -9.49316,-12.28664 -14.94031,-16.16107c-8.44701,-4.10489 -15.62419,-10.82827 -22.04583,-18.33499c14.91317,-0.93272 28.10519,9.00662 41.5616,15.04139c7.27836,2.82782 14.14302,6.80508 20.94839,10.73931c3.12017,-0.01691 13.70792,2.46919 12.65272,-1.34942c-7.93642,-0.3777 -7.14091,-11.39714 -1.80009,-15.76598c7.84996,-6.63017 17.41989,-10.54439 23.95502,-19.32656c2.86703,-2.47023 4.37578,-8.51256 6.79887,-10.41911c10.4482,8.76434 16.56115,22.58962 22.3257,35.70019c9.38679,2.27626 18.86679,4.12257 28.43434,4.67981c9.34321,4.58514 17.32083,12.5762 24.63621,20.6915c5.54341,4.48867 7.02075,16.70268 -0.5145,19.15299c-18.59088,10.74766 -39.34938,14.03317 -59.82166,15.06604c-2.88428,-0.21828 -5.39571,0.12154 -5.41504,4.19154c-1.80321,5.79654 -2.54033,12.53253 -5.93497,17.25218c-3.74642,-1.02839 -0.19721,-12.87328 -4.04481,-7.24541c-7.56818,8.81773 -16.67097,15.43071 -26.00012,21.34448c0,-1.44275 -0.00001,-2.8856 0.00001,-4.32826l0,-0.00001z",
        				scale: {
        					x: 4.279386429597574,
        					y: 8.525188324689012
        				}
        			}
        		}
        		//	Get coordinates from path
        		var pathRest = pathShapes[$scope.fidget.properties.shape].path;
        		var scale = pathShapes[$scope.fidget.properties.shape].scale;
        		var validCommands = ['m', 'l', 'h', 'v', 'c', 's', 'q', 't', 'a', 'z', ' '];	//	See details here: https://www.w3schools.com/graphics/svg_path.asp
        		var oPath = [];
        		var oPos = {};
        		var end = false;
        		var error = false;
        		var i = 0;
        		while (!end && !error) {
					//	Get command's character
        			var command = pathRest.charAt(0).toLowerCase();
        			pathRest = pathRest.substring(1);
					//	If command is unknown, drop error
        			if (validCommands.indexOf(command) === -1)
        				error = true;
					//	This is the "end path" command
        			else if (command == 'z') {
        				end = true;
        			}
        				//	Every other command will contain a pair of x,y coordinates
        			else {
        				//	Check the position of next separator (',' or ' ' between coordinates)
        				var separators = [',', ' '];
        				var sepIndex = pathRest.length;
        				for (var j = 0; j < separators.length; j++) {
        					var io = pathRest.indexOf(separators[j]);
        					if (io !== -1) sepIndex = io < sepIndex ? io : sepIndex;
        				}
        				//	Get X coordinate
        				var x = parseFloat(pathRest.substring(0, sepIndex));
        				pathRest = pathRest.substring(sepIndex + 1);
        				//	Check the position of next separator (any valid command or ',' or ' ' between coordinate pairs)
        				separators = validCommands;
        				sepIndex = pathRest.length;
        				for (var j = 0; j < separators.length; j++) {
        					var io = pathRest.indexOf(separators[j]);
        					if (io !== -1) sepIndex = io < sepIndex ? io : sepIndex;
        				}
        				//	Get Y coordinate
        				var y = parseFloat(pathRest.substring(0, sepIndex));
        				pathRest = pathRest.substring(sepIndex);
        				if (command == 'm') {
        					oPos = {
        						x: x,
        						y: y
        					}
        				}
        				else {
        					oPath[i] = {
        						command: command,
        						x: x,
        						y: y
        					}
        					i++;
        				}
        			}
        		}
        		if (!error) {
        			//	Calculate real coordinates based on samples
        			var oLeft = oPos.x;
        			var oTop = oPos.y;
					var oMinx =  1000000;
					var oMiny =  1000000;
					var oMaxx = -1000000;
					var oMaxy = -1000000;
					for (var i = 0; i < oPath.length; i++) {
						oMinx = oPath[i].x < oMinx ? oPath[i].x : oMinx;
						oMiny = oPath[i].y < oMiny ? oPath[i].y : oMiny;
						oMaxx = oPath[i].x > oMinx ? oPath[i].x : oMaxx;
						oMaxy = oPath[i].y > oMiny ? oPath[i].y : oMaxy;
					}
					oWidth = oMaxx - oMinx;
					oHeight = oMaxy - oMiny;
					if (scale.x == 0 && scale.y == 0) {
						console.log("scale.x: " + ($scope.fidget.properties.width - $scope.fidget.properties.stroke) / oWidth);
						console.log("scale.y: " + ($scope.fidget.properties.height - $scope.fidget.properties.stroke) / oHeight);
					}

					if (scale.x == 0 && scale.y == 0) {
						$scope.fidget.path = 'm' + ($scope.fidget.properties.stroke / 2 + oLeft) + "," + ($scope.fidget.properties.stroke / 2 + oTop);
					}
					else {
						$scope.fidget.path = 'm' + ($scope.fidget.properties.stroke / 2 + oLeft / scale.x * ($scope.fidget.properties.width - $scope.fidget.properties.stroke) / oWidth) + "," + ($scope.fidget.properties.stroke / 2 + oTop / scale.y * ($scope.fidget.properties.height - $scope.fidget.properties.stroke) / oHeight);
					}
					for (var i = 0; i < oPath.length; i++) {
						var newx, newy;
						if (scale.x == 0 && scale.y == 0) {
							newx = oPath[i].x;
							newy = oPath[i].y;
						}
						else {
							newx = oPath[i].x / scale.x * ($scope.fidget.properties.width - $scope.fidget.properties.stroke) / oWidth;
							newy = oPath[i].y / scale.y * ($scope.fidget.properties.height - $scope.fidget.properties.stroke) / oHeight;
						}
						$scope.fidget.path += oPath[i].command + newx + "," + newy;
					}
        		}
        		else
        			console.log("ERROR! Couldn't generate " + $scope.fidget.properties.shape + " shape's path");
        	}

        	$scope.shapeHtml = $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/extendedFidgets/views/fidgets/shapes/" + file + ".html");
        }

        $scope.$watch(function () { return $scope.fidget.properties.shape; }, reloadHtml);
        $scope.$watch(function () { return $scope.fidget.properties.width; }, reloadHtml);
        $scope.$watch(function () { return $scope.fidget.properties.height; }, reloadHtml);
        $scope.$watch(function () { return $scope.fidget.properties.stroke; }, reloadHtml);

        //calculate the bounding rectangle
        $scope.$watchGroup([
            function () { return $scope.fidget.properties.width; },
            function () { return $scope.fidget.properties.height; },
            function () { return $scope.fidget.properties.angle; }],

            function () {

                //allow angle from 0->359 degree
                while ($scope.fidget.properties.angle < 0) {
                    $scope.fidget.properties.angle += 360;
                }

                //rotate size
                $scope.fidget.properties.angle = $scope.fidget.properties.angle % 360;
                _size = angular.copy($scope.size);
                $scope.size = variableService.fitRect(editorService.getFidgetSize($scope.fidget), $scope.fidget.properties.angle * (Math.PI / 180));
                $scope.center = { x: ($scope.fidget.properties.width - $scope.size.width) / 2, y: ($scope.fidget.properties.height - $scope.size.height) / 2 };

                if (_size) {
                    //keep the center point
                    $scope.fidget.properties.top += (_size.height - $scope.size.height) / 2
                    $scope.fidget.properties.left += (_size.width - $scope.size.width) / 2
                }
            });
    }
}