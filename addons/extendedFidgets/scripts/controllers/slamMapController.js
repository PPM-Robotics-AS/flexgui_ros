slamMapCtrl.$inject = ['$http', '$sce', '$scope', '$window', '$location', '$routeParams', '$attrs', 'editorService', 'popupService', 'deviceService', 'scriptManagerService', 'projectService', 'variableService', 'settingsWindowService', '$timeout', '$rootScope'];

function slamMapCtrl($http, $sce, $scope, $window, $location, $routeParams, $attrs, editorService, popupService, deviceService, scriptManagerService, projectService, variableService, settingsWindowService, $timeout, $rootScope) {
    //private variables
    var map, canvas, ctx, mapImg, pointerImg, robotImg, meta = {
        width: 100,
        height: 100
    }, transform = {
    	offset: { x: 0, y: 0 },
    	scale: 1,
		angle: 0
    }, calibPoints = [];

    //robot pointer on the map
    $scope.robot = {
        icon: $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/extendedFidgets/images/robot.png"),
        top: -10,
        left: -10,
        b64: null
    }

    //the map is loaded
    $scope.loaded = false;

    //slam logo
    $scope.slamLogo = $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/extendedFidgets/images/fidgets/slam.png");

    //destination pointer
    $scope.destination = {
        icon: $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/extendedFidgets/images/destination.png"),
        top: 0,
        left: 0,
        show: false,
        b64: null
    }

    $scope.recorded = false;

	//add a calibration point
	//	pointMap = { x: 1, y: 2 }	//recorded position on map using map.data, values between [0, meta.width/height]
	//	pointReal = { x: 3, y: 4 }	//recorded in real world, could be some random value, no reference (yet)
    function addCalibPoint(pointMap, pointReal) {
    	calibPoints.push({
    		pmap: pointMap,
    		preal: pointReal
    	})
		
    	generateTransform();
    }

	//clear calibration points if you need to recalibrate everything
    function clearCalibPoints() {
    	calibPoints = [];
    }

	//generate transform data (returns true on success)
    function generateTransform() {
    	//	If there is no calibration point, don't change transform data
    	if (calibPoints.length == 0)
    		return true;

    	//	If there is only one calibration point, move the map there, but don't rotate/scale it
    	else if (calibPoints.length == 1) {
    		//scale R->M
    		var p1 = {
    			x: calibPoints[0].preal.x / transform.scale,
    			y: calibPoints[0].preal.y / transform.scale,
    		};
    		//rotate R->M
    		var p2 = {
    			x: p1.x * Math.cos(transform.angle) + p1.y * Math.sin(transform.angle),
    			y: -p1.x * Math.sin(transform.angle) + p1.y * Math.cos(transform.angle)
    		};
    		//get transform offset based on move R->M
    		transform.offset.x = p2 - calibPoints[0].pmap.x;
    		transform.offset.y = p2 - calibPoints[0].pmap.y;

    		return true;
    	}

    	//	If there are more than one calibration point, set transform, check error and find optimum using simple resonancy in one axis each time
		//	NOTE: this is probably not the fastest/smartes solution (not a neural network) but just might work if the user calibrates as supposed to
    	else {
    		//get transform offset based on move R->M
    		transform.offset.x = calibPoints[0].preal.x - calibPoints[0].pmap.x;
    		transform.offset.y = calibPoints[0].preal.y - calibPoints[0].pmap.y;
    		//get transform angle based on difference of angles of point0 and point1
    		var amap = Math.atan2(calibPoints[1].pmap.y - calibPoints[0].pmap.y, calibPoints[1].pmap.x - calibPoints[0].pmap.x);
    		var areal = Math.atan2(calibPoints[1].preal.y - calibPoints[0].preal.y, calibPoints[1].preal.x - calibPoints[0].preal.x);
    		transform.angle = areal - amap;
    		//get transform scale based on difference of distances of point0 and point1
    		var amap = calibPoints[1].pmap.x - calibPoints[0].pmap.x
    		var bmap = calibPoints[1].pmap.y - calibPoints[0].pmap.y
    		var cmap = Math.sqrt(amap * amap + bmap * bmap);
    		var areal = calibPoints[1].preal.x - calibPoints[0].preal.x
    		var breal = calibPoints[1].preal.y - calibPoints[0].preal.y
    		var creal = Math.sqrt(areal * areal + breal * breal);
    		transform.scale = creal / cmap;

			//	Search for best solution when there are more than 2 points
    		if (calibPoints.length > 2) {
    			//	Pair of transforms and calculated errors
    			var solutions = [];
    			//	Set default directions of 4D searching trajectory. Mathematical model is hopefully stable, swirl-free
    			var tryDirs = {
    				offsetDir: { x: 200, y: 200 },
    				angleDir: 2,
    				scaleDir: 2
    			}
    			//	Searching goes in 4 loops, current loop can be at (0)=offset.x, (1)=offset.y, (2)=angle, (3)=scale. Start with: 2
    			var tryLoop = 2;
    			//	Direction changes shouldn't enter an infinite loop
    			var tryDirChanges = 0;
    			//	Search for minimum of errors
    			for (var tries = 0; tries < 200; tries++) {
    				//	If this is not the first time we calculate error, modify "transform" a bit
    				if (tries > 0) {
    					switch (tryLoop) {
    						case 0: transform.offset.x += tryDirs.offsetDir.x; break;
    						case 1: transform.offset.y += tryDirs.offsetDir.y; break;
    						case 2: transform.angle += tryDirs.angleDir; break;
    						case 3: transform.scale += tryDirs.scaleDir; break;
    					}
    				}
    				//	Calculate error using square errors method
    				var err = 0;
    				for (i = 2; i < calibPoints.length; i++) {
    					var pr = mapToRealCoord(calibPoints[i].pmap);
    					var da = calibPoints[i].preal.x - pr.x;
    					var db = calibPoints[i].preal.y - pr.y;
    					err += da * da + db * db;
    				}
    				//	Save transform and error in one array
    				solutions[tries] = {
    					transform: transform,
    					err: err
    				}
    				//	There is nothing to compare when "transform" is the default value
    				if (tries > 0) {
    					//	Handle direction/loop change if previous error was smaller than current one
    					if (solutions[tries - 1].err < solutions[tries].err) {
    						transform = solutions[tries - 1].transform;
    						switch (tryLoop) {
    							case 0: transform.offset.x *= -1; break;
    							case 1: transform.offset.y *= -1; break;
    							case 2: transform.angle *= -1; break;
    							case 3: transform.scale = 1 / transform.scale; break;
    						}
    						tryDirChanges++;
							//	If this is the second direction change in one loop, go to next loop
    						if (tryDirChanges == 2) {
    							switch (tryLoop) {
    								case 0: transform.offset.x /= 2; break;
    								case 1: transform.offset.y /= 2; break;
    								case 2: transform.angle /= 2; break;
    								case 3: transform.scale = (transform.scale - 1) / 2 + 1; break;
    							}
    							tryLoop = (tryLoop + 1) % 4;
    							tryDirChanges = 0;
    						}
    					}
    				}
    				tries++;
    			}
    		}
    	}

		//	Returns a range in [0-100]%: cetainity of how good the solution is
    	function checkError() {
    		//	TODO
    		//		get out outstanding values (if there are more points than 2)
    		//		calculate error
    		//		compare current error with best, set this to new best if better
			//		set "ok" to 0-100% as an entropy

    		return 0;
    	}

    	var entropy;
    	while (true) {
    		//TODO: next iteration in setup using calibPoints[]:
    		//	get sequence from last entropies
    		//		try a new rotation/offset/scaling
    		//		try fine rotation/offset/scaling
			//		get max. of entropies, save it as "best"

    		entropy = checkError();
    		if (entropy > 99.99)
    			break;
    	}
    }

	//return the real world coordinates from map coordinates
	//	pointMap = { x: 1, y: 2 }	//recorded position on map using map.data, values between [0, meta.width/height]
	//	pointReal = { x: 3, y: 4 }	//recorded in real world, could be some random value
    function mapToRealCoord(pointMap) {
		//move M->R
    	pointMap.x += transform.offset.x;
    	pointMap.y += transform.offset.y;
    	//rotate M->R
    	pointReal = {
    		x: pointMap.x * Math.cos(transform.angle) - pointMap.y * Math.sin(transform.angle),
    		y: pointMap.x * Math.sin(transform.angle) + pointMap.y * Math.cos(transform.angle)
    	}
    	//scale M->R
    	pointReal.x *= transform.scale;
    	pointReal.y *= transform.scale;

    	return pointReal;
    }

	//return the map coordinates from real world coordinates
	//	pointMap = { x: 1, y: 2 }	//recorded position on map using map.data, values between [0, meta.width/height]
	//	pointReal = { x: 3, y: 4 }	//recorded in real world, could be some random value
    function realToMapCoord(pointReal) {
    	//scale R->M
    	pointReal.x /= transform.scale;
    	pointReal.y /= transform.scale;
    	//rotate R->M
    	pointMap = {
    		x: pointReal.x * Math.cos(transform.angle) + pointReal.y * Math.sin(transform.angle),
    		y: - pointReal.x * Math.sin(transform.angle) + pointReal.y * Math.cos(transform.angle)
    	}
    	//move R->M
    	pointMap.x -= transform.offset.x;
    	pointMap.y -= transform.offset.y;

    	return pointMap;
    }

    //move robot
    var moveRobot = function (pos) {
        if (!destinationTopic) return;

        var robotCoord = mapToRealCoord(pos);
        destinationTopic.publish(new ROSLIB.Message({ x: robotCoord.x, y: robotCoord.y, z: 0 }));

        //set destination 
        $scope.destination.top = parseInt(pos.y * $scope.currentFidget.properties.height / meta.height); 
        $scope.destination.left = parseInt(pos.x * $scope.currentFidget.properties.width / meta.width);
        $scope.destination.show = true;

        //redraw
        draw();
    }

    //redraw canvas
    var draw = function (pos) {
        var fidget = $scope.currentFidget;
        var dest = $scope.destination;
        var rob = $scope.robot;
        var mapCanvas = document.getElementById('slamCanvas_' + $scope.fidget.id);

        if (!mapCanvas) return;

        var mapCtx = mapCanvas.getContext('2d');
        var image = new Image();
        image.onload = function () {
            mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
            mapCtx.save(); // save current state
            mapCtx.translate($scope.fidget.properties.width / 2 + $scope.fidget.properties.hpan, $scope.fidget.properties.height / 2 + $scope.fidget.properties.vpan); //change origin
            mapCtx.rotate($scope.fidget.properties.angle * Math.PI / 180); // rotate
            mapCtx.translate(-$scope.fidget.properties.width / 2, -$scope.fidget.properties.height / 2); //change origin back
            mapCtx.drawImage(image, 0, 0, meta.width, meta.height, 0, 0, $scope.fidget.properties.width * $scope.fidget.properties.zoom, $scope.fidget.properties.height * $scope.fidget.properties.zoom);

            var fidgetRatio = $scope.fidget.properties.width / $scope.fidget.properties.height;
            var mapRatio = meta.width / meta.height;
            var ratioDiff = mapRatio / fidgetRatio;

            //draw robot icon
            if (rob.image && rob.left > -1 && rob.top > -1) {
                mapCtx.drawImage(rob.image,
                    0, 0,
                    meta.width, meta.height,
                    (rob.left - rob.image.width * ($scope.fidget.properties.width / meta.width) / 2) * $scope.fidget.properties.zoom, (rob.top - rob.image.height * ($scope.fidget.properties.height / meta.height)) * $scope.fidget.properties.zoom,
                    $scope.fidget.properties.width * $scope.fidget.properties.zoom, $scope.fidget.properties.height * $scope.fidget.properties.zoom);
            }

            //draw destination icon
            if (dest.image && dest.show) {
                mapCtx.drawImage(dest.image,
                    0, 0,
                    meta.width, meta.height,
                    (dest.left - dest.image.width * ($scope.fidget.properties.width / meta.width) / 2) * $scope.fidget.properties.zoom, (dest.top - dest.image.height * ($scope.fidget.properties.height / meta.height)) * $scope.fidget.properties.zoom,
                    $scope.fidget.properties.width * $scope.fidget.properties.zoom, $scope.fidget.properties.height * $scope.fidget.properties.zoom);
            }

            mapCtx.restore(); // restore original states (no rotation etc)

            //the map is loaded
            $scope.loaded = true;
            $scope.$apply();
        };
        image.src = mapImg;
    }

    //preload image
    var loadImage = function (obj) {
        var img = new Image();
        img.src = obj.icon;
        img.onload = function () {
            obj.image = angular.copy(img);
            $("#temp_Canvas").remove();
        }
    }

    var positionTopic = null, destinationTopic = null, lastRobotPosition = null;

    //init fidget
    $scope.initMapFidget = function () {
        $scope.$watch(function () { return projectService.loaded; }, function () {

            //preload icons for the robot and the destination pointer
            loadImage($scope.robot);
            loadImage($scope.destination);

            $timeout(function () {
                //update reference if project loaded
                fidget = projectService.getFidgetById($scope.fidget.id);
                canvas = document.createElement('canvas');
                ctx = canvas.getContext('2d');

                //get point clound map
                deviceService.callService("/static_map", {}, function (result) {
                    map = result.map;
                    meta.width = result.map.info.width;
                    meta.height = result.map.info.height;
                    canvas.width = meta.width;
                    canvas.height = meta.height;
                    var i = 0, c = [], imgData = ctx.createImageData(meta.width, meta.height);

                    //draw map to canvas
                    angular.forEach(map.data, function (p, i) {
                        var color = p == -1 ? 255 : parseInt(255 - 255 * p / 100);

                        imgData.data[i * 4] = color;
                        imgData.data[i * 4 + 1] = color;
                        imgData.data[i * 4 + 2] = color;
                        imgData.data[i * 4 + 3] = p == -1 ? 0 : 255;
                    })

                    //load and resize map
                    ctx.putImageData(imgData, 0, 0);
                    mapImg = canvas.toDataURL("image/png");
                    draw();
                });

                //add mouse events
                $("#slamCanvas_" + $scope.fidget.id)
                    .mousemove(mouseHandler.move)
            		.mousedown(mouseHandler.down)
            		.mouseup(mouseHandler.up)
                    .mouseleave(mouseHandler.up)
                    .click(mouseHandler.click)
            		.bind("touchmove", function (e) { mouseHandler.move(getTouchEvent(e)); })
            		.bind("touchstart", function (e) { mouseHandler.down(getTouchEvent(e)); })
                    .bind("touchend", function (e) { mouseHandler.up(getTouchEvent(e)); })
                    .bind("touchleave", function (e) { mouseHandler.up(getTouchEvent(e)); });

                //advertise topic
                positionTopic = new ROSLIB.Topic({
                    name: $scope.fidget.properties.positionTopicName,
                    messageType: 'geometry_msgs/Vector3'
                });
                positionTopic.ros = variableService.ros;
                positionTopic.advertise();
            }, 500);

            //resize map
            $scope.$watchGroup([function () { return $scope.fidget.properties.width; }, function () { return $scope.fidget.properties.height; }], function () {
                var dest = $scope.destination;
                var rob = $scope.robot;

                rob.top = -1;
                rob.left = -1;
                dest.show = false;

                draw();
            });

            //advertise position topic
            $scope.$watch(function () { return $scope.fidget.properties.positionTopicName; }, function (nv, ov) {
                if (ov && positionTopic) {
                    //unadvertise old topic
                    positionTopic.unsubscribe();
                }

                if (nv) {
                    //advertise topic
                    positionTopic = new ROSLIB.Topic({
                        ros: variableService.ros,
                        name: $scope.fidget.properties.positionTopicName,
                        messageType: 'geometry_msgs/Vector3'
                    });

                    //subscribe to topic
                    positionTopic.subscribe(function (message) {
                        //convert the real world coordinates to map coordinates
                        var pos = realToMapCoord(message);

                        //save real coordinates of the robot
                        lastRobotPosition = message;

                        //some pointers
                        var robot = $scope.robot, dest = $scope.destination, fidget = $scope.currentFidget;

                        //set robot coordinates
                        robot.top = pos.y * $scope.fidget.properties.height / meta.height;
                        robot.left = pos.x * $scope.fidget.properties.width / meta.width;

                        //redraw
                        draw();
                    });
                }
            });

            //advertise destination topic
            $scope.$watch(function () { return $scope.fidget.properties.destinationTopicName; }, function (nv, ov) {
                if (ov && destinationTopic) {
                    //unadvertise old topic
                    destinationTopic.unadvertise();
                }

                if (nv) {
                    //advertise topic
                    destinationTopic = new ROSLIB.Topic({
                        name: $scope.fidget.properties.destinationTopicName,
                        messageType: 'geometry_msgs/Vector3',
                        ros: variableService.ros

                    });
                    destinationTopic.advertise();
                }
            });

            //redraw
            $scope.$watchGroup([
                    function () { return $scope.fidget.properties.angle; },
                    function () { return $scope.fidget.properties.zoom; },
                    function () { return $scope.fidget.properties.hpan; },
                    function () { return $scope.fidget.properties.vpan; }],

                    function (nv) {
                        draw();
                    });
        });

        //convert touch event to normal
        function getTouchEvent(e) {
            var evt = e.originalEvent.changedTouches[0];
            var ret = {
                clientX: evt.clientX, clientY: evt.clientY,
                screenX: evt.screenX, screenY: evt.screenY,
                offsetX: evt.screenX - $("#" + $scope.currentFidget.id).offset().left, offsetY: evt.screenY - $("#" + $scope.currentFidget.id).offset().top,
                touch: true, touches: e.originalEvent.touches
            }

            return ret;
        }

        var mouseHandler = {
            mouseDown: false,
            moved: false,
            downPos: null,
            lastEvt: null,
            lastDistance: null,
            distance: null,
            down: function (evt) {
                this.mouseDown = true;
                this.downPos = {
                    x: evt.offsetX,
                    y: evt.offsetY
                };
                this.originalProperties = {
                    hpan: $scope.currentFidget.properties.hpan,
                    vpan: $scope.currentFidget.properties.vpan,
                    angle: $scope.currentFidget.properties.angle,
                    zoom: $scope.currentFidget.properties.zoom
                }
            },
            move: function (evt) {
                if (this.mouseDown) {
                    var zooming = evt.ctrlKey;
                    var rotating = evt.shiftKey;

                    if (evt.touches && evt.touches.length > 1) {
                        //skip comparison if lastEvt is missing
                        if (!this.lastEvt) {
                            this.lastEvt = evt;
                            return;
                        }

                        //shorteners
                        var p = this.lastEvt.touches;
                        var c = evt.touches;

                        //disable pinch / swipe per 5 px
                        if (Math.abs(p[0].clientX - c[0].clientX) < 5 &&
                            Math.abs(p[0].clientY - c[0].clientY) < 5 &&
                            Math.abs(p[1].clientX - c[1].clientX) < 5 &&
                            Math.abs(p[1].clientY - c[1].clientY) < 5) return;
                        
                        //distance between touch points
                        var p_dist = Math.sqrt(Math.pow(p[0].clientX - p[1].clientX, 2) + Math.pow(p[0].clientY - p[1].clientY, 2));
                        var c_dist = Math.sqrt(Math.pow(c[0].clientX - c[1].clientX, 2) + Math.pow(c[0].clientY - c[1].clientY, 2));

                        //if the change is bigger than 5px, then it is a zoom
                        if (Math.abs(p_dist - c_dist) > 5) {
                            zooming = true;

                            if (this.distance !== null) {
                                this.lastDistance = this.distance;
                            }

                            this.distance = c_dist;
                        } else {
                            rotating = true;
                        }
                        this.lastEvt = evt;
                    }

                    if (Math.abs(evt.offsetX - this.downPos.x) > 5 || Math.abs(evt.offsetY - this.downPos.y) > 5) {
                        //moved, do not fire click
                        mouseHandler.moved = true;

                        if (zooming) {
                            //set zoom
                            $scope.currentFidget.properties.zoom = evt.touches && evt.touches.length > 1 ?
                                this.lastDistance !== null && this.distance !== null ?
                                    Math.min(10, Math.max(0, this.originalProperties.zoom + (this.distance - this.lastDistance) / 50)) :
                                    this.originalProperties.zoom :
                                Math.min(10, Math.max(0, this.originalProperties.zoom + (evt.offsetX - this.downPos.x) / 50));
                        } else if (rotating) {
                            //set angle
                            $scope.currentFidget.properties.angle = parseInt(this.originalProperties.angle + Math.sqrt(Math.pow(evt.offsetX, 2) + Math.pow(evt.offsetY, 2)));

                            if ($scope.currentFidget.properties.angle > 360) $scope.currentFidget.properties.angle -= 360;
                            if ($scope.currentFidget.properties.angle < 0) $scope.currentFidget.properties.angle += 350
                        } else if (!evt.touches || evt.touches.length == 1) {
                            //pan
                            $scope.currentFidget.properties.hpan = evt.offsetX - this.downPos.x + this.originalProperties.hpan;
                            $scope.currentFidget.properties.vpan = evt.offsetY - this.downPos.y + this.originalProperties.vpan;
                        }
                    }
                }
            },
            up: function (evt) {
                this.mouseDown = false;
                delete this.lastEvt;

                //disable click for 200ms
                window.setTimeout(function () { mouseHandler.moved = false; }, 200);
            },
            click: function (evt) {
                //if moved, skip click
                if (mouseHandler.moved) {
                    return;
                }

                //calculate rotation
                function rotate(cx, cy, x, y, angle) {
                    angle = [null, undefined, "undefined", "NaN"].indexOf(angle) > -1 ? 0 : angle;
                    var radians = (Math.PI / 180) * angle,
                        cos = Math.cos(radians),
                        sin = Math.sin(radians),
                        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
                        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
                    return { x: nx, y: ny };
                }

                //move the coordinates to a 1 zoom, 0,0 panned, 0 rot map
                var click = {
                    x: evt.offsetX - $scope.currentFidget.properties.hpan, // horizontal pan back
                    y: evt.offsetY - $scope.currentFidget.properties.vpan // vertical pan back
                }

                //rotate point back to original position
                click = rotate(
                    $scope.currentFidget.properties.width / 2,
                    $scope.currentFidget.properties.height / 2,
                    click.x,
                    click.y,
                    $scope.currentFidget.properties.angle);

                //zoom out
                click.x = click.x / $scope.currentFidget.properties.zoom;
                click.y = click.y / $scope.currentFidget.properties.zoom;

                //scale the event pointer to the map coordinate
                var coord = { x: parseInt(click.x * meta.width / $scope.currentFidget.properties.width), y: parseInt(click.y * meta.height / $scope.currentFidget.properties.height) };

                if ($scope.currentFidget.properties.isCalibrationOn) {
                    //if the param is missing, add
                    if (!$scope.currentFidget.properties.calibrationPoints) $scope.currentFidget.properties.calibrationPoints = "[]";

                    //add new point
                    var points = JSON.parse($scope.currentFidget.properties.calibrationPoints);
                    points.push({ map: coord, world: lastRobotPosition });

                    //update property
                    $scope.currentFidget.properties.calibrationPoints = JSON.stringify(points);

                    //notify the user that the coordinate is recorded
                    $scope.recorded = true;

                    //hide recorded label
                    $timeout(function () { $scope.recorded = false; }, 1000);
                } else {
                    //move the robot
                    moveRobot(coord);
                }
            }
        }
    }
}