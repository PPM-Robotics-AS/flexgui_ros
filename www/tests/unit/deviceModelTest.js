////////////////////////////////////////////////////////////////////////////////////////////////////
//	Creator:		NYP
//	Update:			2016.04.25
//	Description:	This is a UNIT test for scripts/deviceModel.js
//	Last checked:	3127
////////////////////////////////////////////////////////////////////////////////////////////////////



describe("Device Service Test", function ()
{

	//----------------------------------------------------------------------------------------------
	//	Define default mock functions/classes, create new instances of services
	//----------------------------------------------------------------------------------------------

	beforeEach(function ()
	{

		//	Default setTimeout function
		setTimeout = window.setTimeout;

		//	mock $rootScope		[AngularJS]
		rootScope = {
			$on: function(){},
			$watch: function(){}
		};
		//	mock $rootLocation	[AngularJS]
		rootLocation = {
			$path: function(){}
		};
		//	mock $sce
		sce = {
			trustAsResourceUrl: function () { }
		};
		//	mock $http
		http = {
		};
		//	mock $.getScript function
		$.getScript = function () { };
		//	Mock $ocLazyLoad
		ocLazyLoad = {
			load: function () { }
		};
		//	mock $timeout function
		timeout = function (fn, t, bool) {
		};

		enumServ =			enumService();
		popup =				popupService();		//	/scripts/popupHandler.js
		variable =			variableService();
		colorPicker =		colorPickerService();	//	/scripts/colorPickerHandler.js
		scriptManager =		scriptManagerService(popup, variable);	//	/scripts/scriptManager.js
		fidget =			fidgetService(enumServ, variable, colorPicker, scriptManager, sce, http,
								timeout);	//	/scripts/fidgetTemplates.js
		project =			projectService(rootScope, enumServ, fidget, popup, rootLocation,
								scriptManager, variable, setTimeout);	//	/scripts/projectModel.js
		historyServ =		historyService(project);	//	/scripts/historyHandler.js
		device =			deviceService(rootScope, historyServ, project, variable, popup,
								scriptManager, fidget);		//	/scripts/deviceModel.js

	});



	//----------------------------------------------------------------------------------------------
	//	downloadProject()
	//----------------------------------------------------------------------------------------------

	describe("Downloads the project", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Overwrite timeout function
			calledTimeout = 0;
			setTimeout = function (callback, timeout)
			{
				calledTimeout++;
				expect(callback).toEqual(device.downloadProject);
				expect(timeout).toEqual(1000);
			};

			//	Overwrite callService function
			calledCallService = 0;
			rosVersion = -1;
			device.callService = function (path, params, resultCallback)
			{
				calledCallService++;
				expect(path).toEqual("/rosapi/get_param");

				if (calledCallService == 1)
					expect(params).toEqual({ name: "projectVersion", default: "0" });
				else if (calledCallService == 2)
					expect(params).toEqual({ name: "project" });
				else
					expect(true).toBeFalsy();	//	this should never run

				expect(resultCallback).not.toEqual(null);
				resultCallback({ value: rosVersion });
			};

			//	Overwrite updating ROS
			calledUpdateRos = 0;
			device.updateRos = function () {
				calledUpdateRos++;
			}

			//	Overwrite project loading
			calledLoad = 0;
			project.load = function () {
				calledLoad++;
			}

			//	Overwrite project default
			calledAddDefaultScreens = 0;
			project.addDefaultScreens = function () {
				calledAddDefaultScreens++;
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Test when ROS has the same version number as the project", function ()
		{

			//	PREPARE
			rosVersion = device.projectVersion;

			//	RUN
			device.downloadProject();

			//	VERIFY
			expect(calledTimeout).toEqual(1);
			expect(calledCallService).toEqual(1);	//	called "projectVersion" only
			expect(device.projectVersion).toEqual(rosVersion);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Test when ROS doesn't have the same version number as the project", function ()
		{

			//	PREPARE
			rosVersion = device.projectVersion + 1;

			//	RUN
			device.downloadProject();

			//	VERIFY
			expect(calledTimeout).toEqual(1);
			expect(calledCallService).toEqual(2);	//	called "projectVersion" and "project"
			expect(calledUpdateRos).toEqual(1);
			expect(calledLoad).toEqual(0);			//	because there is no saved project
			expect(calledAddDefaultScreens).toEqual(1);
			expect(device.changeOnUi).toBeFalsy();
			expect(device.projectVersion).toEqual(rosVersion);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	beginDownloadProject()
	//----------------------------------------------------------------------------------------------

	it("Sets project version to -1, then downloads the project", function ()
	{

		//	PREPARE
		//		Overwrite downloadProject function
		calledDownloadProject = 0;
		device.downloadProject = function () {
			calledDownloadProject++;
		};

		//	RUN
		device.beginDownloadProject();

		//	VERIFY
		expect(calledDownloadProject).toEqual(1);
		expect(device.projectVersion).toEqual(-1);

	});



	//----------------------------------------------------------------------------------------------
	//	updateRos()
	//----------------------------------------------------------------------------------------------

	it("Updates ROS", function ()
	{

		//	PREPARE
		//		Default parameters
		myPath = [4];
		//		Mock timeout function
		calledTimeout = 0;
		setTimeout = function (callback, timeout)
		{
			calledTimeout++;
			expect(callback).toEqual(device.updateRos);
			expect(timeout).toEqual(10000);
		};
		//		Mock ros functions
		calledGetTopics = 0;
		calledGetServices = 0;
		variable.ros = {
			getTopics: function (fn) {
				calledGetTopics++;
				fn(myPath);
			},
			getServices: function (fn) {
				calledGetServices++;
				fn(myPath);
			}
		}
		//		Mock findRemovedInterfaces function
		calledFindRemovedInterfaces = 0;
		device.findRemovedInterfaces = function (pathList, topics) {
			calledFindRemovedInterfaces++;
			expect(pathList).toEqual(myPath);
			if (calledFindRemovedInterfaces == 1)
				expect(topics).toEqual(device.topics);
			else
				expect(topics).toEqual(device.services);
		};
		//		Mock other ros functions
		calledGetTopicType = 0;
		variable.ros.getTopicType = function (path, fn) {
			calledGetTopicType++;
			expect(path).toEqual(myPath[0]);
			fn(5);
		};
		calledGetMessageDetails = 0;
		variable.ros.getMessageDetails = function (type, fn) {
			calledGetMessageDetails++;
			expect(type).toEqual(5);
			fn(6);
		}
		//		Mock addNewInterface
		calledAddNewInterface = 0;
		device.addNewInterface = function () {
			calledAddNewInterface++;
		};
		//		Mock device.Topic
		calledTopic = 0;
		device.Topic = function () {
			calledTopic++;
			return {};
		};
		//		Mock device.Service
		calledService = 0;
		device.Service = function () {
			calledService++;
			return {};
		};

		//	RUN
		device.updateRos();

		//	VERIFIY
		expect(calledTimeout).toEqual(1);
		expect(calledGetTopics).toEqual(1);
		expect(calledGetTopicType).toEqual(1);
		expect(calledGetMessageDetails).toEqual(1);
		expect(calledGetServices).toEqual(1);
		expect(calledFindRemovedInterfaces).toEqual(2);
		expect(calledAddNewInterface).toEqual(2);

	});



	//----------------------------------------------------------------------------------------------
	//	addNewInterface(_interf)
	//	findRemovedInterfaces(pathList, interfaceList)
	//----------------------------------------------------------------------------------------------

	describe("Adds new interface; Finds and removes topics and nodes", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	How many times subscribe is called
			calledSubscribe = 0;
			calledSubscribeIncr = function () {
				calledSubscribe++;
			};

			//	Custom service object
			ifaceService = {
				nodeName: "test",
				path: "path",
				shortPath: "sp",
				isTopic: false,
				subscribed: true,
				friendlyName: "frn",
				subscribe: calledSubscribeIncr
			};

			//	Custom topic object
			ifaceTopic = {
				nodeName: "test2",
				path: "path2",
				shortPath: "sp2",
				isTopic: true,
				subscribed: false,
				friendlyName: "frn2",
				subscribe: calledSubscribeIncr
			};

			//	Interface list and path list for "findRemovedInterfaces(pathList, interfaceList)"
			ifaceList = [];
			ifaceList.push(ifaceService);
			pList = [];
			pList[ifaceService.path] = -1;

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	addNewInterface(_interf)
		//

		it("Test adding services and topics", function ()
		{

			//	RUN (adding a new service)
			device.addNewInterface(ifaceService);

			//	VERIFY
			expect(device.nodes[ifaceService.nodeName]).not.toEqual(undefined);
			expect(device.nodes[ifaceService.nodeName][ifaceService.shortPath]).
				toEqual(ifaceService);
			expect(device.services[0]).toEqual(ifaceService);
			expect(device.services.length).toEqual(1);
			expect(device.changeOnUi).toBeTruthy();
			expect(calledSubscribe).toEqual(1);		//	Service calls subscribe
			expect(variable.friendlyCache[ifaceService.friendlyName]).not.toEqual(undefined);
			expect(variable.friendlyCache[ifaceService.friendlyName]).toEqual(ifaceService);

			//	RUN (adding an existing service)
			device.addNewInterface(ifaceService);

			//	VERIFY
			expect(device.nodes[ifaceService.nodeName]).not.toEqual(undefined);
			expect(device.nodes[ifaceService.nodeName][ifaceService.shortPath]).
				toEqual(ifaceService);
			expect(device.services[0]).toEqual(ifaceService);
			expect(device.services.length).toEqual(1);	//	No new services
			expect(device.changeOnUi).toBeTruthy();
			expect(calledSubscribe).toEqual(1);		//	Subscribe is not called if service exists
			expect(variable.friendlyCache[ifaceService.friendlyName]).not.toEqual(undefined);
			expect(variable.friendlyCache[ifaceService.friendlyName]).toEqual(ifaceService);

			//	RUN (adding a new topic)
			device.addNewInterface(ifaceTopic);

			//	VERIFY
			expect(device.nodes[ifaceTopic.nodeName]).not.toEqual(undefined);
			expect(device.nodes[ifaceTopic.nodeName][ifaceTopic.shortPath]).toEqual(ifaceTopic);
			expect(device.topics[0]).toEqual(ifaceTopic);
			expect(device.changeOnUi).toBeTruthy();
			expect(calledSubscribe).toEqual(1);		//	Topic doesn't call subscribe
			expect(variable.friendlyCache[ifaceTopic.friendlyName]).not.toEqual(undefined);
			expect(variable.friendlyCache[ifaceTopic.friendlyName]).toEqual(ifaceTopic);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	findRemovedInterfaces(pathList, interfaceList)
		//

		it("Test adding a new interface then removing it", function ()
		{

			//	RUN (adding a new service)
			device.addNewInterface(ifaceService);
			device.findRemovedInterfaces(pList, ifaceList);

			//	VERIFY
			expect(device.nodes[ifaceService.nodeName]).toEqual(undefined);
			expect(device.changeOnUi).toBeTruthy();

		});

	});



	//----------------------------------------------------------------------------------------------
	//	Interface(path, _this)
	//----------------------------------------------------------------------------------------------

	it("Defines a new interface", function ()
	{

		//	PREPARE
		iface = {};
		path_ = "/folder/subfolder/filename.ext";

		//	RUN
		device.Interface(path_, iface);

		//	VERIFY
		expect(iface).toEqual({
			isInterface: true,
			path: path_,
			shortPath: "subfolder/filename.ext",
			nodeName: "folder",
			_friendlyName: null
		});

	});



	//----------------------------------------------------------------------------------------------
	//	callService(path, params, resultCallback)
	//----------------------------------------------------------------------------------------------

	it("Calls a service", function ()
	{

		//	PREPARE
		//		Default properties
		myPath = "path";
		myParams = "params";
		calledCallback = 0;
		myCallback = function (result) {
			calledCallback++;
			expect(result).toEqual(5);
		};
		//		Mock ROSLIB
		calledRoslibService = 0;
		calledRoslibServiceRequest = 0;
		calledCallService = 0;
		ROSLIB = {
			Service: function (obj) {
				calledRoslibService++;
				expect(obj).toEqual({
					ros: variable.ros,
					name: myPath
				});
				return {
					callService: function (req, fn) {
						calledCallService++;
						expect(req).toEqual({ a: 1 });
						fn(5)
					}
				};
			},
			ServiceRequest: function (params) {
				calledRoslibServiceRequest++;
				expect(params).toEqual(myParams);
				return { a: 1 };
			}
		};

		//	RUN
		device.callService(myPath, myParams, myCallback);

		//	VERIFY
		expect(calledRoslibService).toEqual(1);
		expect(calledRoslibServiceRequest).toEqual(1);
		expect(calledCallService).toEqual(1);
		expect(calledCallback).toEqual(1);

	});



	//----------------------------------------------------------------------------------------------
	//	Service(path)
	//----------------------------------------------------------------------------------------------

	it("Service class", function ()
	{

		//	PREPARE
		path = "/folder/subfolder/filename.ext";
		calledService = 0;
		device.callService = function (p1, p2, fn) {
			calledService++;
			expect(p1).toEqual(path);
			expect(p2).toEqual("parameters");
			expect(fn).toEqual("callback");
		};

		//	RUN
		device.Service(path);

		//	VERIFY
		expect(device.isInterface).toBeTruthy();
		expect(device.path).toEqual(path);
		expect(device.shortPath).toEqual("subfolder/filename.ext");
		expect(device.nodeName).toEqual("folder");
		expect(device._friendlyName).toEqual(null);
		expect(device.isService).toBeTruthy();
		device.call("parameters", "callback");
		expect(calledService).toEqual(1);

	});



	//----------------------------------------------------------------------------------------------
	//	Topic(path, type, details)
	//----------------------------------------------------------------------------------------------

	it("Topic class", function ()
	{

		//	PREPARE
		myPath = "/folder/subfolder/filename.ext";
		myType = "topicType";
		details = "topicDetails";
		//		Mock interface function
		calledInterface = 0;
		device.Interface = function (path, obj) {
			calledInterface++;
			expect(path).toEqual(myPath);
			expect(obj).toEqual(this);
		};
		//		Mock ROSLIB
		calledRoslibTopic = 0;
		calledRoslibSubscribe = 0;
		ROSLIB = {
			Topic: function (obj) {
				calledRoslibTopic++;
				expect(obj).toEqual({
					ros: variable.ros,
					name: myPath,
					messageType: myType,
					// Max 2 messages/s
					throttle_rate: 500
				});
				return {
					subscribe: function (fn) {
						calledRoslibSubscribe++;
						fn("1");
					}
				};
			},
		};
		//		Mock getSubscribed function
		calledGetSubscribed = 0;
		project.interfaceMetaData.getSubscribed = function () {
			calledGetSubscribed++;
			return false;
		};
		//		Mock scriptManager function
		calledCompile = 0;
		scriptManager.compile = function (scr) {
			calledCompile++;
			expect(scr).toEqual(project.changeScripts[myPath]);
		};

		//	RUN
		device.Topic(myPath, myType, details);

		//	VERIFY
		expect(calledInterface).toEqual(1);
		expect(device.isTopic).toBeTruthy();
		expect(device.type).toEqual("topicType");
		expect(device.details).toEqual("topicDetails");
		expect(device.value).toEqual(null);

		//	PREPARE
		device.path = myPath;
		project.changeScripts = [];
		project.changeScripts[myPath] = 5;

		//	RUN (test subscribe function as well)
		device.subscribe();

		//	VERIFY
		expect(calledRoslibTopic).toEqual(1);
		expect(calledRoslibSubscribe).toEqual(1);
		expect(calledGetSubscribed).toEqual(1);
		expect(calledCompile).toEqual(1);
		expect(device.changeOnUi).toBeTruthy();
		expect(device.subscribed).toBeFalsy();

	});



	//----------------------------------------------------------------------------------------------
	//	refreshUi()
	//----------------------------------------------------------------------------------------------

	describe("Refreshes the UI when there is a change", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Overwrite rootScope's $apply function
			calledApply = 0;
			rootScope.$apply = function () {
				calledApply++;
			};

			//	Overwrite timeout function
			calledTimeout = false;
			setTimeout = function (callback, timeout) {
				calledTimeout++;
				expect(callback).toEqual(device.refreshUi);
				expect(timeout).toEqual(200);
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Test when UI doesn't need to refresh", function ()
		{

			//	PREPARE
			device.changeOnUi = false;

			//	RUN
			device.refreshUi();

			//	VERIFY
			expect(device.changeOnUi).toBeFalsy();
			expect(calledApply).toEqual(0);
			expect(calledTimeout).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Test when UI needs to refresh", function ()
		{

			//	PREPARE
			device.changeOnUi = true;

			//	RUN
			device.refreshUi();

			//	VERIFY
			expect(device.changeOnUi).toBeFalsy();
			expect(calledApply).toEqual(1);
			expect(calledTimeout).toEqual(1);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	saveProject(saveHistory)
	//----------------------------------------------------------------------------------------------

	describe("Saves the project to server", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Overwrite saveState function
			calledSaveState = 0;
			historyServ.saveState = function () {
				calledSaveState++;
			};

			//	Set initial project version
			initialProjectVersion = 5;
			device.projectVersion = initialProjectVersion;

			//	Overwrite set_param function, saves parameters in paramGet[]
			calledSetParam = 0;
			paramGet = [];
			device.nodes = {
				rosapi: {
					set_param: {
						call: function (param) {
							calledSetParam++;
							paramGet.push(param);
						}
					}
				}
			};

			//	Set the right structure to handle project data (see deviceModel.js : line 336-358)
			seen = [];
			projectJson = JSON.stringify({
				screens: project.screens,
				initScript: project.initScript,
				background: project.backgroundImage,
				name: project.name,
				changeScripts: project.changeScripts || {},
				id: project.id,
				interfaceMetaDataList: project.interfaceMetaData.list,
			}, function (key, val) {
				if (!val && val !== 0) {
					return "@null";
				}

				if (val != null && typeof val == "object") {
					if (seen.indexOf(val) >= 0) {
						return;
					}
					seen.push(val);
				}
				return val;
			});

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Test if history is saved and rosapi parameters are set or not", function ()
		{

			//	RUN
			device.saveProject(true);

			//	VERIFY
			expect(calledSaveState).toEqual(1);
			expect(calledSetParam).toEqual(2);	//	called "project" and "projectVersion"
			expect(paramGet).not.toEqual(null);
			expect(paramGet[0]).toEqual({
				name: 'project',
				value: projectJson
			});
			expect(paramGet[1]).toEqual({
				name: 'projectVersion',
				value: device.projectVersion.toString()
			});
			expect(device.prevProjectVersion).toEqual(initialProjectVersion);
			expect(device.projectVersion).not.toEqual(initialProjectVersion);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Test if history is saved and rosapi parameters are set or not", function ()
		{

			//	RUN
			device.saveProject(false);

			//	VERIFY
			expect(calledSaveState).toEqual(0);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	save(proj, version, overwrite)
	//----------------------------------------------------------------------------------------------

	it("Saves the project to local storage", function ()
	{

		//	PREPARE
		project = {
			id: 12345,
			object: 23456
		};
		localStorage.clear();

		//	RUN
		ret = device.save(project, 5, true);

		//	VERIFY
		expect(project.version).toEqual(5);
		expect(ret).toBeTruthy();
		expect(localStorage.project_12345).toEqual(JSON.stringify({
			"id": project.id,
			"object": project.object,
			"version": 5
		}));

	});



	//----------------------------------------------------------------------------------------------
	//	init(location)
	//----------------------------------------------------------------------------------------------
//TODO:	It should test the try part as well, not just catch

	describe("Initializes the class", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{
			//	Default parameters
			device.connected = true;
			//	Mock onCantConnectToRos function
			calledOnCantConnectToRos = 0;
			device.onCantConnectToRos = function () {
				calledOnCantConnectToRos++;
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Test when ROSLIB is unerachable", function ()
		{

			//	RUN
			device.init("testLocation");

			//	VERIFY
			expect(device.location).toEqual("testLocation");
			expect(calledOnCantConnectToRos).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Test when ROSLIB is mocked", function ()
		{

			//	PREPARE
			//		Mock ROSLIB.Ros function
			calledRos = 0;
			calledRosOn = 0;
			ROSLIB.Ros = function (obj) {
				calledRos++;
				expect(obj).toEqual({
					url: device.server
				});
				return {
					on: function (name, fn) {
						calledRosOn++;
						if (calledRosOn == 1)
						{
							expect(name).toEqual("connection");
						}
						else if (calledRosOn == 2)
						{
							expect(name).toEqual("error");
							//	Don't run recursive function
							device.secure = false;
						}
						else if (calledRosOn == 3)
						{
							expect(name).toEqual("close");
						}
						fn();
						if (calledRosOn == 1)
						{
							expect(device.connected).toBeTruthy();
							expect(device.changeOnUi).toBeTruthy();
							expect(calledOnCantConnectToRos).toEqual(0);
						}
						else if (calledRosOn == 2)
						{
							expect(device.connected).toBeFalsy();
							expect(device.changeOnUi).toBeTruthy();
							expect(calledOnCantConnectToRos).toEqual(1);
						}
						else if (calledRosOn == 3)
						{
							expect(name).toEqual("close");
							expect(connected).toBeFalsy();
							expect(calledOnCantConnectToRos).toEqual(2);
						}
					}
				};
			};

			//	RUN
			device.init("testLocation");

			//	VERIFY
			expect(calledRos).toEqual(1);
			expect(calledRosOn).toEqual(3);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	offlineModeDialog()
	//	connectionLostDialog()
	//----------------------------------------------------------------------------------------------

	describe("Test dialogs", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Mock bootbox functions
			calledDialog = 0;
			calledHideAll = 0;
			bootbox = {
				dialog: function (obj) {
					calledDialog++;
					return obj;
				},
				hideAll: function () {
					calledHideAll++;
				}
			}

		});



		//------------------------------------------------------------------------------------------
		//	TEST: offlineModeDialog()
		//

		it("Offline mode dialog", function ()
		{

			//	PREPARE
			//		Mock connectionLostDialog function
			calledConnectionLostDialog = 0;
			calledConnectionLostDialogModal = 0;
			device.connectionLostDialog = function () {
				calledConnectionLostDialog++;
				return {
					modal: function (type) {
						calledConnectionLostDialogModal++;
						expect(type).toEqual('show');
					}
				};
			};

			//	RUN
			ret = device.offlineModeDialog();

			//	VERIFY
			expect(ret.message).toEqual(localization.currentLocal.ros.demoBody);
			expect(ret.backdrop).toEqual('static');
			expect(ret.closeButton).toBeFalsy();
			expect(ret.keyboard).toBeFalsy();
			expect(ret.show).toBeFalsy();
			expect(ret.title).toEqual(localization.currentLocal.ros.connectionError);
			expect(ret.buttons.back.label).toEqual(localization.currentLocal.ros.back);
			expect(ret.buttons.back.className).toEqual('btn-danger');
			expect(ret.buttons.success.label).toEqual(localization.currentLocal.ros.keepProject);
			ret.buttons.back.callback();
			expect(calledHideAll).toEqual(1);
			expect(calledConnectionLostDialog).toEqual(1);
			expect(calledConnectionLostDialogModal).toEqual(1);
			expect(ret.buttons.success.className).toEqual("btn-success");
//TODO:	ret.buttons.success.callback();
			expect(ret.buttons.danger.label).toEqual(localization.currentLocal.ros.discardProject);
			expect(ret.buttons.danger.className).toEqual("btn-primary");
//TODO: ret.buttons.danger.callback();

		});



		//------------------------------------------------------------------------------------------
		//	TEST: connectionLostDialog()
		//

		it("Connection lost dialog", function ()
		{

			//	PREPARE
			//		Mock connectionLostDialog function
			calledofflineModeDialog = 0;
			calledofflineModeDialogModal = 0;
			device.offlineModeDialog = function () {
				calledofflineModeDialog++;
				return {
					modal: function (type) {
						calledofflineModeDialogModal++;
						expect(type).toEqual('show');
					}
				};
			};

			//	RUN
			ret = device.connectionLostDialog();

			//	VERIFY
			expect(ret.message).toEqual(localization.currentLocal.ros.connectionErrorBody);
			expect(ret.backdrop).toEqual('static');
			expect(ret.closeButton).toBeFalsy();
			expect(ret.show).toBeFalsy();
			expect(ret.keyboard).toBeFalsy();
			expect(ret.title).toEqual(localization.currentLocal.ros.connectionError);
			expect(ret.buttons.success.label).toEqual(localization.currentLocal.ros.reconnect);
			expect(ret.buttons.success.className).toEqual("btn-success");
//TODO:	ret.buttons.success.callback();
			expect(ret.buttons.danger.label).toEqual(localization.currentLocal.ros.offlineMode);
			expect(ret.buttons.danger.className).toEqual("btn-primary");
			ret.buttons.danger.callback();
			expect(calledofflineModeDialog).toEqual(1);
			expect(calledofflineModeDialogModal).toEqual(1);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	onCantConnectToRos()
	//----------------------------------------------------------------------------------------------

	describe("Get modal when can't connect to ROS", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Mock connectionLostDialog function
			calledConnectionLostDialog = 0;
			calledConnectionLostDialogModal = 0;
			device.connectionLostDialog = function () {
				calledConnectionLostDialog++;
				return {
					modal: function (type) {
						calledConnectionLostDialogModal++;
						expect(type).toEqual('show');
					}
				};
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Device is connected", function ()
		{

			//	PREPARE
			//		Default parameters
			device.connected = true;

			//	RUN
			device.onCantConnectToRos();

			expect(calledConnectionLostDialog).toEqual(0);
			expect(calledConnectionLostDialogModal).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Device is connected", function ()
		{

			//	PREPARE
			//		Default parameters
			device.connected = false;

			//	RUN
			device.onCantConnectToRos();

			expect(calledConnectionLostDialog).toEqual(1);
			expect(calledConnectionLostDialogModal).toEqual(1);

		});

	});

});
