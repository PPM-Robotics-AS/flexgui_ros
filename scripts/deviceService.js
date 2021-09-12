﻿deviceService.$inject = ['$rootScope', 'historyService', 'projectService', 'variableService', 'popupService', 'scriptManagerService', 'fidgetService', '$interval', '$timeout'];

function deviceService($rootScope, historyService, projectService, variableService, popupService, scriptManagerService, fidgetService, $interval, $timeout) {

	// Communication with the ROS
	var device = {
		//connection starts from unconnected state
		connected: false,

		nodes: {},
		rosUpdated: null,
		reconnect: ["true", true].indexOf(localStorage.getItem("reconnect")) > -1 || false,
		//server address
		ip: localStorage.getItem("diIp") || "localhost",
		port: localStorage.getItem("diPort") || 9090,
		secure: ["true", true, null].indexOf(localStorage.getItem("diSecure")) > -1 || window.location.protocol == 'https:',
		localAddons: ["true", true, null].indexOf(localStorage.getItem("localAddons")) > -1,
		// The list of topics in ROS
		topics: [],

		// The list of services in ROS
		services: [],

		// True if the ROS update is started already
		rosUpdateStarted: false,

		nextRosUpdate: null,

		// Updates the list of topics, then calls itself after a delay
		updateRos: function () {
			if (!variableService.ros) return;

            console.log("Update ROS");

			if (device.nextRosUpdate) {
				$timeout.cancel(device.nextRosUpdate);
				delete device.nextRosUpdate;
			}

			var _topicList = [];
			var _serviceList = [];

			var getNextTopicWithDetails = function(idx) {
				// Current topic path
				var path = _topicList[idx];

				variableService.ros.getTopicType(path, function (type) {
					// Returns details from the type string
					variableService.ros.getMessageDetails(type, function (details) {
						// Everything is ready to assembly a Topic
						var _interf = new device.Topic(path, type, details);

						device.addNewInterface(_interf);

						//switch offline state for topic
						var topic = device.nodes[_interf.nodeName][_interf.shortPath];

						if (topic.isOffline) {
							device.callService("/rosapi/publishers", {
								topic: topic.path
							}, function (resp) {
								if (resp.publishers.length > 0) {
									topic.isOffline = false;
									topic.subscribe();
								}
							});
						}

						if (++idx < _topicList.length) {
							getNextTopicWithDetails(idx)
						} else {
							device.rosUpdated = new Date();
						}
					}, function(err) { console.log(err); });
				}, function(err){ console.log(err); });
			}

			var getNextServiceType = function(idx) {
				var path = _serviceList[idx];

				variableService.ros.getServiceType(path, function (type) {
					// Simpler then Topic, because no type data available, but can be used still.
					device.addNewInterface(new device.Service(path, type));

					if (++idx < _serviceList.length) {
						getNextServiceType(idx);
					}
				});
			}

			variableService.ros.getTopics(function(pathList) {
				_topicList = pathList;
				if (_topicList.length > 0) getNextTopicWithDetails(0);
			});

			variableService.ros.getServices(function(pathList) {
				_serviceList = pathList;
				if (_serviceList.length > 0) getNextServiceType(0);
			});

			device.nextRosUpdate = $timeout(device.updateRos, 10000);
		},

		//init topic's value from project
		initTopicFromProject: function (_interf) {
			//get default value from project
			var meta = projectService.interfaceMetaData.find(_interf.path);
			if (meta && meta.lastValue) {
				_interf.value = angular.copy(meta.lastValue);
				device.overwriteProperties(_interf.value, _interf);
			}
		},

		setTopicFromMeta: function (t, meta) {
			if (t.initedFromProject) return;

			if (t.subscribe != meta.subscribed && meta.subscribed) {
				t.subscribed = meta.subscribed;
			}

			if (t.friendlyName != meta.friendlyName) {
				t.friendlyName = meta.friendlyName;
				variableService.friendlyCache[t.friendlyName] = t;
			}

			if (t.deepFriendlyNames != meta.deepFriendlyNames) {
				t.deepFriendlyNames = meta.deepFriendlyNames;
				angular.forEach(Object.keys(t.deepFriendlyNames), function (key) {
					var friendlyName = t.deepFriendlyNames[key];
					variableService.friendlyCache[friendlyName] = {
						__isDeep: true,
						value: "$rootScope.device.nodes['" + t.nodeName + "']" + key
					}
				});
			}

			t.initedFromProject = true;
		},

		// Adds a new interface if it's not already there
		addNewInterface: function (_interf) {
			if (device.nodes[_interf.nodeName] == undefined)
				device.nodes[_interf.nodeName] = {
					__isNode: true,
					__name: _interf.nodeName
				};

			//If the topic is already present, no action is required
			if (device.nodes[_interf.nodeName][_interf.shortPath]) {
				var interf = device.nodes[_interf.nodeName][_interf.shortPath];
				if (!interf.details && _interf.details) {
					interf.details = _interf.details;
				}

				return;
			}

			device.nodes[_interf.nodeName][_interf.shortPath] = _interf;

			//Adding the interface to the flat list
			if (_interf.isTopic) {
				device.topics.push(_interf);
				device.initTopicFromProject(_interf);
			} else
				device.services.push(_interf);

			device.changeOnUi = true;

			if (_interf.subscribed) {
				_interf.subscribe();
			}

			if (_interf.friendlyName)
				variableService.friendlyCache[_interf.friendlyName] = _interf;

			fidgetService.scriptDict = {};
			//console.log(nodes);
			//console.log("topic ready:", topic);
		},

		// Finds and removes removed topics and nodes
		findRemovedInterfaces: function (pathList, interfaceList) {

			return;

			var toRemove = [];
			angular.forEach(interfaceList, function (_interf) {
				//If the interface is not in the list anymore
				if (pathList.indexOf(_interf.path) == -1 && device.nodes[_interf.nodeName].isDirectConnection != true && _interf.temp != true) {
					toRemove.push(_interf);
				}
			});

			angular.forEach(toRemove, function (_interf) {
				if (_interf.isTopic && projectService.interfaceMetaData.find(_interf.path)) {
					_interf.isOffline = true;
				} else {
					//Remove the interface from the flat list
					interfaceList.splice(interfaceList.indexOf(_interf), 1);
					var node = device.nodes[_interf.nodeName];
					//Remove the interface from the node
					delete node[_interf.shortPath];

					device.changeOnUi = true;

					var interfaceLeft = false;
					// If the node becomes empty, it will be removed
					angular.forEach(Object.keys(node), function (leftInterface) {
						//If there is any topic left, the node is not deleted
						if (node[leftInterface].isInterface)
							interfaceLeft = true;
					});

					if (!interfaceLeft) {
						delete device.nodes[_interf.nodeName];
					}
				}
			});
		},

		// Base class for Service and Topic
		Interface: function (path, _this) {
			// Helps identifying interfaces
			_this.isInterface = true;
			// The full path of the topic
			_this.path = path;
			// Cuts down the name of the node
			_this.shortPath = path.substring(path.substring(1).indexOf("/") + 2);
			// Cuts down leading /, jumps over it as well, searching for the 2nd one
			_this.nodeName = path.substring(1, path.substring(1).indexOf("/") + 1);
			// Defines the friendlyName property
			_this._friendlyName = projectService.interfaceMetaData.getFriendlyName(path);
			Object.defineProperty(_this, "friendlyName", {
				get: function () {
					return _this._friendlyName;
				},
				set: function (newValue) {
					// Store the old friendly name to be able to delete from the cache
					if (!_this._oldFriendlyName) _this._oldFriendlyName = _this._friendlyName;

					// Set the new friendly name
					_this._friendlyName = newValue;
				}
			});
		},

		cleanNodes: function () {
			function fn(i) {
				//reset friendlyName, subscribed, deepfriendlyNames
				i.friendlyName = null;
				i.subsribed = false;
				i.deepFriendlyNames = {};
			}

			projectService.interfaceMetaData.list = [];

			//reset topics and services
			angular.forEach(device.topics, fn);
			angular.forEach(device.services, fn);

			device.updateRos();
			device.updateFriendlyCache();
		},

		//update friendly Cache
		updateFriendlyCache: function () {
			if (!device.hasDupes()) {
				var updateFn = function (_this) {
					if (variableService.friendlyCache[_this._oldFriendlyName]) {
						//empty scriptDict
						fidgetService.scriptDict = {};

						delete variableService.friendlyCache[_this._oldFriendlyName];
						delete _this._oldFriendlyName;
					}

					// Put the interface in the friendlyCache
					if (_this.friendlyName)
						variableService.friendlyCache[_this.friendlyName] = _this;

					// Saves the change in the projectService.
					projectService.interfaceMetaData.setFriendlyName(_this.path, _this.isTopic ? _this.type : null, _this.friendlyName);

					//empty scriptDict
					fidgetService.scriptDict = {};
				}

				angular.forEach(device.topics, updateFn);
				angular.forEach(device.services, updateFn);

				//device.saveProject(true);

				projectService.needSave = {
					history: true,
					ts: Date.now()
				};
			} else {
				var restoreFn = function (_this) {
					if (_this._oldFriendlyName) {
						_this._friendlyName = _this._oldFriendlyName;
						delete _this._oldFriendlyName;
					}
				}

				angular.forEach(device.topics, restoreFn);
				angular.forEach(device.services, restoreFn);
			}
		},

		hasDupes: function () {
			var hasDupe = false;

			angular.forEach(device.topics, function (i) {
				var deepDupe = false;
				angular.forEach(i.deepFriendlyNames, function (name) {
					deepDupe = deepDupe || device.isDupe(name);
				});
				hasDupe = hasDupe || deepDupe || device.isDupe(i.friendlyName)
			});

			angular.forEach(device.services, function (i) {
				hasDupe = hasDupe || device.isDupe(i.friendlyName)
			});
			return hasDupe;
		},

		//Counts the interfaces that are using the 'name' friendly name.
		countFriendly: function (name) {
			result = 0;

			var countFn = function (_interf) {
				if (_interf.deepFriendlyNames) {
					angular.forEach(_interf.deepFriendlyNames, function (friendlyName) {
						if (friendlyName == name)
							result++;
					});
				}

				if (_interf.friendlyName == name)
					result++;
			};

			angular.forEach(device.topics, countFn);
			angular.forEach(device.services, countFn);

			return result;
		},

		//An interface is using duplicated friendly name if more than 1 occurs in the interface list.
		isDupe: function (friendlyName, nm) {
			//if a special name is presented, check for that, otherwise check for the existing value
			return friendlyName && (nm ? device.countFriendly(nm) == 1 : device.countFriendly(friendlyName) > 1);
		},

		//call service on ros
		callService: function (path, params, resultCallback) {
			var client = new ROSLIB.Service({
				ros: variableService.ros,
				name: path
			});

			var request = new ROSLIB.ServiceRequest(params);

			client.callService(request, function (result) {
				if (resultCallback) {
					resultCallback(result);
				}
				device.changeOnUi = true;
			});
		},

		//get interface by path
		getInterface: function (path) {
			var ret = null;

			//go through the services and topics
			angular.forEach(device.topics, function (t) {
				if (t.path == path) ret = t
			});
			angular.forEach(device.services, function (s) {
				if (s.path == path) ret = s
			});

			return ret;
		},

		// Service class for handling service related logic
		Service: function (path, type) {
			// Constructs the base class
			device.Interface(path, this);
			// Helps identifying services
			this.isService = true;
			// Type of the service
			this.type = type;
			// Calling the service. Results in a callback.
			this.call = function (params, resultCallback) {
				//Test: nodes["/"].spawn.call({x:0, y:0, theta:0})
				//Test: nodes["/"].spawn.call({x:0,y:0,theta:0}, function(result){#message("Spawned: " + result.name)})
				//Test: nodes["/"].reset.call()
				device.callService(path, params, resultCallback);
			}
		},

		//overwrite properties to be able to update with a simple call
		overwriteProperties: function (obj, thisTopic) {
			if (!obj || typeof obj !== "object") return;

			angular.forEach(Object.keys(obj), function (key) {
				//save property value
				obj["_" + key] = angular.copy(obj[key]);

				//overwrite properties recursively
				device.overwriteProperties(obj["_" + key], thisTopic);

				//remove property to be able to create getter and setter
				delete obj[key];

				//create getter and setter
				Object.defineProperty(obj, key, {
					get: function () {
						return obj["_" + key];
					},
					set: function (v) {
						//send value to ROS
						function publish() {
							//set the original property
							obj["_" + key] = v;

							//save the new value
							var publishValue = angular.copy(thisTopic.value);

							//set back the property names
							function createOriginalNames(obj) {
								if (!obj || typeof obj !== "object") return;
								angular.forEach(Object.keys(obj), function (key) {
									createOriginalNames(obj[key]);
									obj[key.substring(1)] = angular.copy(obj[key]);
									delete obj[key];
								});
							}

							//change back the names
							createOriginalNames(publishValue);

							var parts = thisTopic.type.split("/");

							//check if there is any special setter for the given type
							if (device.topicSetters[parts[0]]) {
								device.topicSetters[parts[0]](thisTopic, publishValue);
							} else {
								//publish topic
								thisTopic.listener.publish(publishValue);
							}

							//create the getters/setters for the new value
							device.overwriteProperties(v, thisTopic);
						}

						var canPublish = true;
						//if the topic is offline, prevent value publish and alert the user
						if (thisTopic.isOffline) {
							popupService.show(localization.currentLocal.settings.tabs.nodes.topicOfflineError, popupService.types.error);
							canPublish = false;
							return;
						}

						//if the topic is online, but the value may not be up to date (we don't have the last value from ROS) ask the user what to do
						if (!thisTopic.upToDate) {
							bootbox.confirm(localization.currentLocal.settings.tabs.nodes.topicOutOfDateWarning, function (result) {
								if (result) {
									publish();
								}
							});
						} else {
							publish();
						}
					}
				});
			});
		},

		// Callbacks when a topic is subscribed on ROS
		subscribeCallbacks: [],

		// Array to hold the changed topics
		changedTopics: [],
		// Topic class for handling topic related logic
		Topic: function (path, type, details, offline) {
			// Constructs the base class
			device.Interface(path, this);
			// Helps identifying topics
			this.isTopic = true;
			// The type of the topic
			this.type = type;
			// Details of the type information
			this.details = details;
			// The last value received
			this.value = null;
			// Deep friendly names
			this.deepFriendlyNames = projectService.interfaceMetaData.getDeepFriendlyNames(path);
			// Add deep friendly names to friendly cache
			var topic = this;
			// Value is from ROS (latest)
			this.upToDate = false;
			// The topic is offline
			this.isOffline = offline == true ? true : false;
			// Save reference to the publisher check
			this.publisherCheckInterval = null;
			// Change functions
			this.onChangeFunctions = {};
			// Set topic value
			this.setValue = function (message) {
				//save the last value to the project if it is null
				if (projectService.interfaceMetaData.getLastValue(this.path) == null) {
					projectService.interfaceMetaData.setLastValue(this.path, this.type, angular.copy(message));
					//device.saveProject(false);
					projectService.needSave = {
						history: false,
						ts: Date.now()
					};
				}

				this.upToDate = true;

				// Compares the content of the values, to avoid unnecessary ui updates
				if (!_.isEqual(message, this.value)) {
					//save the old value
					var oldValue = angular.copy(this.value);
					//start overwriting properties
					device.overwriteProperties(message, this);

					//set the value to the overwrited ones
					this.value = message;

					//add the topics to the changed topics
					device.changedTopics.push({
						topic: topic,
						oldValue: oldValue
					});

					//allow update UI
					device.changeOnUi = true;

					//empty script dict
					fidgetService.scriptDict = {};

					//call onchange function
					angular.forEach(Object.keys(this.onChangeFunctions), function (key) {
						topic.onChangeFunctions[key](message);
					})

					//console.log("Updated", this.path);
				}
			}

			angular.forEach(Object.keys(this.deepFriendlyNames), function (key) {
				//add a new object to the friendly cache and mark, it is a deep friendly name
				var friendlyName = topic.deepFriendlyNames[key];
				variableService.friendlyCache[friendlyName] = {
					__isDeep: true,
					value: "$rootScope.device.nodes['" + topic.nodeName + "']" + key
				}
			});

			this.subscribe = function (callback) {
				//if the topic is offline, skip subscription
				if (this.isOffline || device.nodes[this.nodeName].isDirectConnection) return;

				//remove listener if there is any
				if (this.listener) {
					this.listener.unsubscribe();
					delete this.listener;
				}

				//remove publisher check interval on subscribe to prevent multiple checks
				if (topic.publisherCheckInterval) {
					$interval.cancel(topic.publisherCheckInterval);
					delete topic.publisherCheckInterval;
				}

				//check publishers and try to reconnect if there is none
				topic.publisherCheckInterval = $interval(function () {
					//call rosapi's publishers service which will return the publisher count of a given topic
					device.callService("/rosapi/publishers", {
						topic: topic.path
					}, function (resp) {
						//change topic to offline if all of the publishers are gone
						topic.isOffline = resp.publishers.length == 0;
						//all publisher is gone, retry to connect
						if (resp.publishers.length == 0 && this._subscribed) {
							//remove ROS listener
							topic.listener.unsubscribe();
							delete topic.listener;

							//resubscribe, build up the connection between publisher and subscriber again
							$timeout(topic.subscribe, 1000);
						}
					});
				}, 30000); //check in every 30 sec

				// The Topic object to handle listening
				this.listener = new ROSLIB.Topic({
					ros: variableService.ros,
					name: this.path,
					messageType: this.type,
					// Max 2 messages/s
					throttle_rate: 100
				});

				// This will mean another object in the subscribe
				this.listener.subscribe(function (message) {
					topic.setValue(message);
				});

				//subscribe callback function
				if (callback) callback();

				//fire subscribe event and call all of the subscribed functions with the topic as parameter
				if (device.subscribeCallbacks && device.subscribeCallbacks.length > 0) {
					angular.forEach(device.subscribeCallbacks, function (callback) {
						callback(topic);
					});
				}
			};

			// Property to handle subscribed binding
			this._subscribed = projectService.interfaceMetaData.getSubscribed(path);
			Object.defineProperty(this, "subscribed", {
				get: function () {
					return this._subscribed;
				},
				set: function (newValue) {

					this._subscribed = newValue;

					// Saves the change in the projectService.
					if (projectService.interfaceMetaData.setSubscribed(path, type, newValue)) {
						projectService.needSave = {
							history: false,
							ts: Date.now()
						};
					}

					if (this._subscribed) {
						this.subscribe();
					} else {
						//Unsubscribe
						if (this.listener) {
							this.listener.unsubscribe();
						}

						if (this.publisherCheckInterval) {
							$interval.cancel(this.publisherCheckInterval);
							delete this.publisherCheckInterval;
						}
					}
				}
			});
		},

		// Special setters for some topics
		topicSetters: {},

		// Stores if there is a change on the UI
		changeOnUi: false,
		// Lock the UI change 
		lockUiChange: false,
		// Refreshes the UI if there is a change
		refreshUi: function () {
			if (device.changeOnUi && !device.lockUiChange) {
				//console.log("Update UI");
				device.changeOnUi = false;
				$rootScope.$apply();
			}

			$timeout(device.refreshUi, 200, false);
		},

		// Close connection modal window
		cancelConnect: function () {
			delete $rootScope.blockMessage;
			delete $rootScope.blockHtml;
		},

		// Limit the upload and update of the project
		_updateEnabled: false,
		_uploadEnabled: false,
		cantConnectToRosVisible: false,
		retryHandler: null,
		retryCount: 0,
		cancelRetry: function (showCantConnect) {
			if (device.retryHandler) {
				window.clearInterval(device.retryHandler);
				delete device.retryHandler;
			}

			if (showCantConnect) {
				device.onCantConnectToRos();
			}
		},
		// Sets up the ROS and its callback events
		init: function () {

			try {

				if (!device.retryHandler) {
					$rootScope.blockMessage = localization.currentLocal.starting.connectToRos;
					$rootScope.blockHtml = "views/rosLoading.html";
				} else {
					$rootScope.blockMessage = "Reconnecting to ROS";
					$rootScope.blockHtml = "views/rosReconnect.html";
				}

				variableService.ros = new ROSLIB.Ros({
					url: device.server
				});

				//ROS Event handling
				variableService.ros.on('connection', function () {
					if (device.retryHandler) location.reload();

					delete $rootScope.blockHtml;

					localStorage.setItem("diSecure", device.secure);
					device.connected = true;
					device.changeOnUi = true;

					$rootScope.blockMessage = localization.currentLocal.project.loading;
					device.updateRos();
				});

				variableService.ros.on('error', function (error) {

					if (device.retryHandler) return;

					//retry connection with the other security mode (ws / wss)
					//retry only if we are not on https, then we have to force https
					if (device.secure == ["true", true, null].indexOf(localStorage.getItem("diSecure")) > -1 && window.location.protocol != 'https:') {
						device.secure = !device.secure;
						device.init(location);
					} else {
						device.connected = false;
						device.changeOnUi = true;
						device.onCantConnectToRos();
					}
				});

				variableService.ros.on('close', function () {
					if (device.connected) {
						device.connected = false;

						if (device.reconnect) {
							device.retryCount = 0;
							device.retryHandler = window.setInterval(function () {
								device.retryCount++;

								if (device.retryCount == 30) {
									//timeout
									device.cancelRetry();
									device.onCantConnectToRos();
									return;
								}

								device.init();
							}, 1000);
						} else {
							device.onCantConnectToRos();
						}


					}
					device.changeOnUi = true;
				});

				this.initDone = Date.now();
			} catch (exception) {
				if (device.connected) {
					device.connected = false;
					device.onCantConnectToRos();
				}
			}
		},

		offlineModeDialog: function () {
			return bootbox.dialog({
				message: localization.currentLocal.ros.demoBody,
				backdrop: 'static',
				closeButton: false,
				keyboard: false,
				show: false,
				title: localization.currentLocal.ros.connectionError,
				buttons: {
					back: {
						label: localization.currentLocal.ros.back,
						className: 'btn-danger',
						callback: function () {
							bootbox.hideAll();
							device.connectionLostDialog().modal('show');
						}
					},
					success: {
						label: localization.currentLocal.ros.keepProject,
						className: "btn-success",
						callback: function () {
							//restart in offline mode, and keep the CURRENT project
							localStorage.setItem("offlineMode", true);
							localStorage.setItem("localProject", projectService.toJSON(null, false));
							location.reload();
						}
					},
					danger: {
						label: localization.currentLocal.ros.discardProject,
						className: "btn-primary",
						callback: function () {
							//restart in offline mode, and keep the LOCAL project
							localStorage.setItem("offlineMode", true);
							location.reload();
						}
					},
				}
			})
		},

		connectionLostDialog: function () {

			var buttons = {
				success: {
					label: localization.currentLocal.ros.reconnect,
					className: "btn-success",
					callback: function () {
						//restart app and try to reconnect
						location.reload();
					}
				},
				danger: {
					label: localization.currentLocal.ros.offlineMode,
					className: "btn-primary",
					callback: function () {
						bootbox.hideAll();
						device.offlineModeDialog().modal('show');
					}
				}
			}

			if ($rootScope.editHandler.isEditAvailable()) {
				buttons.info = {
					label: localization.currentLocal.editMode.settings,
					className: "btn-info",
					callback: function () {
						bootbox.hideAll();
						$rootScope.$apply(function () {
							delete $rootScope.blockHtml;
							delete $rootScope.blockMessage;

							$rootScope.settings.setVisible(true);
						});
					}
				}
			}

			return bootbox.dialog({
				message: localization.currentLocal.ros.connectionErrorBody,
				backdrop: 'static',
				closeButton: false,
				show: false,
				keyboard: false,
				title: localization.currentLocal.ros.connectionError,
				buttons: buttons,
				onEscape: function () {
					device.cantConnectToRosVisible = false;
				}
			})
		},

		onCantConnectToRos: function () {
			if ($rootScope.blockMessage == localization.currentLocal.project.loading) $rootScope.blockMessage = null;

			if (!device.connected && !device.cantConnectToRosVisible) {
				device.cantConnectToRosVisible = true;
				device.connectionLostDialog().modal('show');
			}
		},
	};

	//if the project is loaded at the first time, update the offline topics from interface meta data
	$rootScope.$watchCollection(function () {
		return projectService.interfaceMetaData.list;
	}, function (nv, ov) {
		//The project is loaded, we can release the lock
		device.lockUiChange = false;

		//check the prev. project interfaceMetadataList if it has some difference
		if (projectService.prevProject) {
			angular.forEach(projectService.prevProject.interfaceMetaData.list, function (meta) {
				//find offline interfaces to remove
				var m = projectService.interfaceMetaData.find(meta.path);
				var t = device.getInterface(meta.path);

				if (!m && t && t.isOffline) {
					//if the topic is presented as offline topic, but not used
					//in the new project, we can remove
					var index = device.topics.indexOf(t);
					var n = device.nodes[t.nodeName];
					if (index > -1) {
						//console.log("Remove topic: ", t);
						device.topics.splice(index, 1);
					}
				}

				if (t) {
					//remove node if empty
					var isNodeEmpty = true;
					angular.forEach(device.topics, function (topic) {
						if (t.nodeName == topic.nodeName) isNodeEmpty = false;
					});
					angular.forEach(device.services, function (topic) {
						if (t.nodeName == topic.nodeName) isNodeEmpty = false;
					});
					if (isNodeEmpty) {
						//console.log("Node is empty, remove");
						delete device.nodes[t.nodeName];
					}
				}
			});
		}

		//After the load we have to load the topics
		angular.forEach(projectService.interfaceMetaData.list, function (meta) {

			var t = device.getInterface(meta.path);

			//if the ROS is not containing the topic, we have to add as offline topic
			if (!t && meta.isTopic) {
				//create an offline topic
				var topic = new device.Topic(meta.path, meta.type, null, true);
				//add new offline topic to the list
				device.addNewInterface(topic);
			} else if (t) {
				device.setTopicFromMeta(t, meta);
			}
		});

		//Notify the UI on the next cycle
		device.changeOnUi = true;
	});

	//server url property
	Object.defineProperty(device, 'server', {
		get: function () {
			return (device.secure || window.location.protocol == 'https:' ? "wss://" : "ws://") + device.ip + ":" + device.port + "/";
		}
	});

	//delete script dict in every 5 sec
	$interval(function () {
		fidgetService.scriptDict = {};
	}, 5000, 0, false);

	//delete changedScripts
	device.changedTopicWatchers = [];
	$interval(function () {
		//get the min index
		var minIndex = device.changedTopics.length;
		angular.forEach(device.changedTopicWatchers, function (w) {
			var i = w.get();
			if (minIndex > i) minIndex = i;
		});

		//remove until the min index
		if (minIndex > 0) {
			device.changedTopics.splice(0, minIndex);
		}

		//decrese the current index
		angular.forEach(device.changedTopicWatchers, function (w) {
			var i = w.get() - minIndex;
			w.set(i);
		});
	}, 5000, 0, false);

	device.refreshUi();
	return device;
}