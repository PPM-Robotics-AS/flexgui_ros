////////////////////////////////////////////////////////////////////////////////////////////////////
//	Creator:		NYP
//	Update:			2016.04.12
//	Description:	This is a UNIT test for scripts/projectModel.js
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

		//	Mock $rootScope		[AngularJS]
		rootScope = {
			$on: function () { },
			$watch: function () { },
			$watchGroup: function () { },
			editScreen: function () { },
			addModal: function () { }
		};
		//	Mock $rootLocation	[AngularJS]
		calledRootLocationPath = 0;
		rootLocation = {
			path: function () {
				calledRootLocationPath++;
				return {
					substring: function (value) { }
				}
			}
		};
		//	mock $sce
		sce = {
			trustAsResourceUrl: function () { }
		};
		//	mock $http
		http = {
		};
		//	Mock $ocLazyLoad
		ocLazyLoad = {
			load: function () { }
		};
		//	mock $timeout function
		timeout = function (fn, t, bool) {
		};

		enumServ = enumService();
		popup = popupService();		//	/scripts/popupHandler.js
		variable = variableService();
		colorPicker = colorPickerService();	//	/scripts/colorPickerHandler.js
		scriptManager = scriptManagerService(popup, variable);	//	/scripts/scriptManager.js
		fidget = fidgetService(enumServ, variable, colorPicker, scriptManager, sce, http, timeout);	//	/scripts/fidgetTemplates.js
		background = backgroundService(rootScope, colorPicker);
		project = projectService(rootScope, enumServ, fidget, popup, rootLocation, scriptManager,
			variable, setTimeout, background);	//	/scripts/projectModel.js
		factoryDesigner = factoryDesignerService(enumServ, project, fidget, colorPicker, enumServ,
			rootScope);	//	/addons/factoryDesigner/factoryDesigner.js
		settingsWindow = settingsWindowService(project, device, popup, rootScope);		//	/scripts/settingsWindowHandler.js
		advancedScripting = advancedScriptingService(ocLazyLoad, project, popup, settingsWindow,
			rootScope, scriptManager, fidget);	//	/addons/advancedScripting/advancedScripting.js

	});



	//----------------------------------------------------------------------------------------------
	//	getScreen(name, type)
	//----------------------------------------------------------------------------------------------

	describe("Adds new interface; Finds and removes topics and nodes", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Mock getId function
			calledGetId = 0;
			project.getId = function () {
				calledGetId++;
				return 123;
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Returns with a new, empty screen", function ()
		{

			//	RUN
			ret = project.getScreen("test");
			
			//	VERIFY
			expect(ret).toEqual({
				id: 123,
				type: enumServ.screenTypesEnum.Normal,
				properties: { name: "test" },
				fidgets: []
			});

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Returns with a new, empty screen with custom type", function ()
		{

			//	RUN
			ret = project.getScreen("test", 234);

			//	VERIFY
			expect(ret).toEqual({
				id: 123,
				type: 234,
				properties: { name: "test" },
				fidgets: []
			});

		});

	});



	//----------------------------------------------------------------------------------------------
	//	changeScriptEditor functions
	//----------------------------------------------------------------------------------------------
//TODO:	Put this in advancedScriptingTest

	describe("Project's onChange editor for ROS topics", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			myT = {
				path: "path"
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1:	setCurrentTopic(t)
		//

		it("Returns with a new, empty screen", function ()
		{
			
			//	RUN
			project.changeScriptEditor.setCurrentTopic(myT);

			//	VERIFY
			expect(project.changeScriptEditor.currentTopic).toEqual(myT);
			expect(project.changeScriptEditor.script).toEqual("/* onChange script here */");

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2:	setCurrentTopic(t)
		//

		it("Returns with a new, empty screen with predefined onChange script", function ()
		{

			//	PREPARE
			project.changeScripts[myT.path] = 3;

			//	RUN
			project.changeScriptEditor.setCurrentTopic(myT);

			//	VERIFY
			expect(project.changeScriptEditor.currentTopic).toEqual(myT);
			expect(project.changeScriptEditor.script).toEqual(project.changeScripts[myT.path]);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	setVisible(v, t)
		//

		it("Editor window visible set + topic", function ()
		{

			//	PREPARE
			//		Mock setCurrentTopic function
			calledCurrentTopic = 0;
			project.changeScriptEditor.setCurrentTopic = function (t) {
				calledCurrentTopic++;
				expect(t).toBeTruthy();
			};


			//	RUN 1
			project.changeScriptEditor.setVisible(false, false);

			//	VERIFY
			expect(project.changeScriptEditor.visible).toBeFalsy();


			//	RUN 2
			project.changeScriptEditor.setVisible(false, true);

			//	VERIFY
			expect(project.changeScriptEditor.visible).toBeFalsy();


			//	RUN 3
			project.changeScriptEditor.setVisible(true, false);

			//	VERIFY
			expect(project.changeScriptEditor.visible).toBeFalsy();


			//	RUN 4
			project.changeScriptEditor.setVisible(true, true);

			//	VERIFY
			expect(project.changeScriptEditor.visible).toBeTruthy();
			expect(calledCurrentTopic).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	saveScript(callback)
		//

		describe("Saves onchange script and checks if it is okay or not", function ()
		{

			//--------------------------------------------------------------------------------------
			//	PREPARE
			//

			beforeEach(function ()
			{

				//	Mock callback function
				calledCallback = 0;
				myCallback = function () {
					calledCallback++;
				};
				//	Mock popup's show function
				calledShow = 0;
				popup.show = function (text, type) {
					calledShow++;
					expect(type).toEqual(popup.types.error);
				};
				//	Mock setVisible function
				calledSetVisible = 0;
				project.changeScriptEditor.setVisible = function (v, t) {
					calledSetVisible++;
					expect(v).toBeFalsy();
				}
				//	Default parameters
				project.changeScriptEditor.currentTopic = {
					path: 2
				}

			});



			//--------------------------------------------------------------------------------------
			//	TEST 1
			//

			it("Bad script", function ()
			{

				//	PREPARE
				myScript = "This is a bad script"
				project.changeScriptEditor.script = myScript;

				//	RUN
				project.changeScriptEditor.saveScript(myCallback);

				//	VERIFY
				expect(calledShow).toEqual(1);
				expect(calledCallback).toEqual(0);	//	Bad script is a bad script
				expect(calledSetVisible).toEqual(0);

			});



			//--------------------------------------------------------------------------------------
			//	TEST 2
			//

			it("Good script", function ()
			{

				//	PREPARE
				myScript = "var a = \"This is a good script\""
				project.changeScriptEditor.script = myScript;

				//	RUN
				project.changeScriptEditor.saveScript(myCallback);

				//	VERIFY
				expect(calledShow).toEqual(0);	//	No error
				expect(project.changeScripts[project.changeScriptEditor.currentTopic.path]).toEqual(
					myScript);
				expect(calledCallback).toEqual(1);
				expect(calledSetVisible).toEqual(1);

			});

		});

	});



	//----------------------------------------------------------------------------------------------
	//	generateIndexImage(screen, callback)
	//----------------------------------------------------------------------------------------------

	it("Generates index image", function ()
	{

		//	PREPARE
		//		Default parameters
		myScreen = {};
		calledToDataURL = 0;
		myCanvas = {
			height: 1234,
			width: 2345,
			toDataURL: function (t, v) {
				calledToDataURL++;
				expect(t).toEqual("image/jpeg");
				expect(v).toEqual(0.3);
				return 5;
			}
		};
		//		Mock callback function
		calledCallback = 0;
		myCallback = function () {
			calledCallback++;
		};
		//		Mock html2canvas function
		calledHtml2canvas = 0;
		html2canvas = function (element, obj) {
			calledHtml2canvas++;
			expect(element).toEqual(null);	//	there is no DOM
			expect(obj.onrendered).not.toEqual(undefined);	//	there should be a callback function
			obj.onrendered(myCanvas);
		};
		//		Mock halfScale function
		calledHalfScale = 0;
		project.halfScale = function (canvas, w, h) {
			calledHalfScale++;
			expect(canvas).toEqual(myCanvas);
			if (canvas.height / 2 > 240 && canvas.width / 2 > 400) {
				expect(w).toEqual(undefined);
				expect(h).toEqual(undefined);
			}
			else {
				expect(w).toEqual(400);
				expect(h).toEqual(240);
			}
			canvas.width /= 2;
			canvas.height /= 2;
			return canvas;
		};

		//	RUN
		project.generateIndexImage(myScreen, myCallback);

		//	VERIFY
		expect(calledHtml2canvas).toEqual(1);
		expect(calledHalfScale).toEqual(3);	//	While runs twice, then one more with w,h params
		expect(myScreen.indexImage).toEqual(5);	//	Returned by myCanvas.toDataURL
		expect(calledCallback).toEqual(1);

	});



	//----------------------------------------------------------------------------------------------
	//	halfScale(canvas, w, h)
	//----------------------------------------------------------------------------------------------
//TODO:	Finish this function

	it("Generates index image", function ()
	{

		//	PREPARE
		//		Default parameters
		myCanvas = {
			height: 1234,
			width: 2345,
		};

		//	RUN
		//ret = project.halfScale(myCallback);

		//	VERIFY

	});



	//----------------------------------------------------------------------------------------------
	//	toJSON()
	//----------------------------------------------------------------------------------------------
//TODO



	//----------------------------------------------------------------------------------------------
	//	parseJSON()
	//----------------------------------------------------------------------------------------------
//TODO



	//----------------------------------------------------------------------------------------------
	//	getId()
	//----------------------------------------------------------------------------------------------

	it("Generates index image", function ()
	{

		//	PREPARE
		testMax = 100;

		//	RUN
		for (var i = 0; i < testMax; i++)
		{
			ret = project.getId();
			project.screens[i] = {
				id: ret
			}

		}

		//	VERIFY
		for (var i = 0; i < testMax; i++)
		{
			for (var j = i + 1; j < testMax; j++)
			{
				expect(project.screens[i]).not.toEqual(project.screens[j]);
			}
		}

	});



	//----------------------------------------------------------------------------------------------
	//	showAddScreen(val)
	//----------------------------------------------------------------------------------------------

	describe("Generates index image", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			myScreen = 5;
			//	Mock action function
			calledAction = 0;
			project.screenTypes = [{
				action: function () {
					calledAction++;
				}
			}];

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Calls action function", function ()
		{

			//	RUN
			project.showAddScreen(myScreen);

			//	VERIFY
			expect(calledAction).toEqual(1);
			expect(project.addScreenVisible).not.toEqual(myScreen);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Calls action function", function ()
		{

			//	PREPARE
			project.screenTypes[1] = {};

			//	RUN
			project.showAddScreen(myScreen);

			//	VERIFY
			expect(calledAction).toEqual(0);
			expect(project.addScreenVisible).toEqual(myScreen);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	interfaceMetaData functions
	//----------------------------------------------------------------------------------------------

	describe("Metadata for interfaces", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			project.interfaceMetaData.list = [{
				path: "path1",
				friendlyName: "friendlyName1",
				subscribed: true
			}, {
				path: "path2"
			}, {
				path: "path3"
			}];

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	find(path)
		//

		it("Finds metadata for the given path. Returns null if not found", function ()
		{

			//	RUN 1
			ret = project.interfaceMetaData.find(5)

			//	VERIFY
			expect(ret).toEqual(null);

			for (var i = 0; i < project.interfaceMetaData.list.length; i++)
			{
				//	RUN 2
				ret = project.interfaceMetaData.find(project.interfaceMetaData.list[i].path)

				//	VERIFY
				expect(ret).toEqual(project.interfaceMetaData.list[i]);
			}

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1:	add(path)
		//

		it("Adds a new metadata entry", function ()
		{

			//	PREPARE
			myPath = "pathNew";
			//		Mock remove function
			calledRemove = 0;
			project.interfaceMetaData.remove = function (path) {
				calledRemove++;
				expect(path).toEqual(myPath);
			};

			//	RUN
			ret = project.interfaceMetaData.add(myPath);

			//	VERIFY
			expect(calledRemove).toEqual(1);
			expect(project.interfaceMetaData.list.length).toEqual(4);
			expect(project.interfaceMetaData.list[project.interfaceMetaData.list.length - 1]).
				toEqual(ret);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2:	add(path)
		//

		it("Replaces an already existing metadata entry with same path", function ()
		{

			//	PREPARE
			myPath = "path2";
			//		Don't mock remove function!

			//	RUN
			ret = project.interfaceMetaData.add(myPath);

			//	VERIFY
			expect(project.interfaceMetaData.list.length).toEqual(3);	//	replaced
			expect(project.interfaceMetaData.list[project.interfaceMetaData.list.length - 1]).
				toEqual(ret);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1:	remove(path)
		//

		it("Removes a metadata entry, test if find() function runs", function ()
		{

			//	PREPARE
			myPath = "path2";
			//		Mock find function
			calledFind = 0;
			project.interfaceMetaData.find = function (path) {
				calledFind++;
				return -1;
			};

			//	RUN
			project.interfaceMetaData.remove(myPath);

			//	VERIFY
			expect(calledFind).toEqual(1);
			expect(project.interfaceMetaData.list.length).toEqual(3);	//	No change

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2:	remove(path)
		//

		it("Removes a metadata entry", function ()
		{

			//	PREPARE
			myPath = "path2";

			//	RUN
			project.interfaceMetaData.remove(myPath);

			//	VERIFY
			expect(project.interfaceMetaData.list.length).toEqual(2);
			for (var i = 0; i < project.interfaceMetaData.list.length; i++) {
				expect(project.interfaceMetaData.list[i].path).not.toEqual(myPath);
			}

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1:	setFriendlyName(path, friendlyName)
		//

		it("Sets the friendly name for an entry, test if find() function runs", function ()
		{

			//	PREPARE
			myPath = "path2";
			myFName = "friendlyName";
			//		Mock find function
			calledFind = 0;
			project.interfaceMetaData.find = function (path) {
				calledFind++;
				return -1;
			};
			//		Mock add function
			calledAdd = 0;
			project.interfaceMetaData.add = function (path) {
				calledAdd++;
			};

			//	RUN
			project.interfaceMetaData.setFriendlyName(myPath, myFName);

			//	VERIFY
			expect(calledFind).toEqual(1);
			expect(calledAdd).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2:	setFriendlyName(path, friendlyName)
		//

		it("Sets the friendly name for a new entry", function ()
		{

			//	PREPARE
			myPath = "pathNew";
			myFName = "friendlyName";

			//	RUN
			project.interfaceMetaData.setFriendlyName(myPath, myFName);

			//	VERIFY
			expect(project.interfaceMetaData.list.length).toEqual(4);
			expect(project.interfaceMetaData.list[3]).toEqual({
				path: myPath,
				friendlyName: myFName,
				subscribed: false
			});

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3:	setFriendlyName(path, friendlyName)
		//

		it("Resets the friendly name for an existing entry", function ()
		{

			//	PREPARE
			myPath = "path2";
			myFName = undefined;
			//		Mock remove function
			calledRemove = 0;
			project.interfaceMetaData.remove = function (path) {
				calledRemove++;
			};

			//	RUN
			project.interfaceMetaData.setFriendlyName(myPath, myFName);

			//	VERIFY
			expect(calledRemove).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4:	setFriendlyName(path, friendlyName)
		//

		it("Sets the friendly name for an existing entry", function ()
		{

			//	PREPARE
			myPath = "path2";
			myFName = "friendlyName";

			//	RUN
			project.interfaceMetaData.setFriendlyName(myPath, myFName);

			//	VERIFY
			expect(project.interfaceMetaData.list[1].friendlyName).toEqual(myFName);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1:	setSubscribed(path, subscribed)
		//

		it("Sets the subscribtion for an entry, test if find() function runs", function ()
		{

			//	PREPARE
			myPath = "path2";
			mySubscribe = true;
			//		Mock find function
			calledFind = 0;
			project.interfaceMetaData.find = function (path) {
				calledFind++;
				return -1;
			};
			//		Mock add function
			calledAdd = 0;
			project.interfaceMetaData.add = function (path) {
				calledAdd++;
			};

			//	RUN
			project.interfaceMetaData.setSubscribed(myPath, mySubscribe);

			//	VERIFY
			expect(calledFind).toEqual(1);
			expect(calledAdd).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2:	setSubscribed(path, subscribed)
		//

		it("Sets the subscribtion for a new entry", function ()
		{

			//	PREPARE
			myPath = "pathNew";
			mySubscribe = true;

			//	RUN
			project.interfaceMetaData.setSubscribed(myPath, mySubscribe);

			//	VERIFY
			expect(project.interfaceMetaData.list.length).toEqual(4);
			expect(project.interfaceMetaData.list[3]).toEqual({
				path: myPath,
				friendlyName: null,
				subscribed: mySubscribe
			});

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3:	setSubscribed(path, subscribed)
		//

		it("Resets the subscribtion for an existing entry", function ()
		{

			//	PREPARE
			myPath = "path2";
			mySubscribe = undefined;
			//		Mock remove function
			calledRemove = 0;
			project.interfaceMetaData.remove = function (path) {
				calledRemove++;
			};

			//	RUN
			project.interfaceMetaData.setSubscribed(myPath, mySubscribe);

			//	VERIFY
			expect(calledRemove).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4:	setSubscribed(path, subscribed)
		//

		it("Sets the subscribtion for an existing entry", function ()
		{

			//	PREPARE
			myPath = "path2";
			mySubscribe = true;

			//	RUN
			project.interfaceMetaData.setSubscribed(myPath, mySubscribe);

			//	VERIFY
			expect(project.interfaceMetaData.list[1].subscribed).toEqual(mySubscribe);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	getSubscribed(path)
		//

		it("Returns if the metadata is subscribed", function ()
		{

			//	PREPARE
			myPath = "path1";

			//	RUN
			ret = project.interfaceMetaData.getSubscribed(myPath);

			//	VERIFY
			expect(ret).toEqual(project.interfaceMetaData.list[0].subscribed);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	getFriendlyName(path)
		//

		it("Returns if the metadata is subscribed", function ()
		{

			//	PREPARE
			myPath = "path1";

			//	RUN
			ret = project.interfaceMetaData.getFriendlyName(myPath);

			//	VERIFY
			expect(ret).toEqual(project.interfaceMetaData.list[0].friendlyName);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	setupFidgets(callback)
	//----------------------------------------------------------------------------------------------

	it("Setup getters and setters for all private members of fidgets in the project", function ()
	{

		//	PREPARE
		//		Default parameters
		project.screens = [{
			id: undefined,
			type: undefined,
			containerLevel: -1,
			fidgets: [{}, {}]
		}, {
			id: undefined,
			type: enumServ.screenTypesEnum.Factory,
			containerLevel: 0,
			fidgets: [{}, {}, {
				source: "fidgetGroup",
				fidgets: [{}, {}, {}, {}]
			}]
		}];
		//		Mock callback function
		calledCallback = 0;
		myCallback = function (fidget) {
			calledCallback++;
		};
		//		Mock defineProperties function
		calledDefineProperties = 0;
		fidget.defineProperties = function (fidget) {
			calledDefineProperties++;
		};

		//	RUN
		project.setupFidgets(myCallback);

		//	VERIFY
		expect(project.screens[0].id).not.toEqual(undefined);
		expect(project.screens[0].type).toEqual(enumServ.screenTypesEnum.Normal);
		expect(project.screens[0].containerLevel).toEqual(0);
		expect(project.screens[1].id).not.toEqual(undefined);
		expect(project.screens[1].type).toEqual(enumServ.screenTypesEnum.Factory);
		expect(project.screens[1].containerLevel).toEqual(0);
		expect(project.screens[0].fidgets[0]).toEqual({
			parent: project.screens[0],
			containerLevel: 1
		});
		expect(calledDefineProperties).toEqual(9);	//	There is a total of 9 fidgets
		expect(calledCallback).toEqual(9);	//	There is a total of 9 fidgets

	});



	//----------------------------------------------------------------------------------------------
	//	updateFidgets(container)
	//----------------------------------------------------------------------------------------------
//TODO



	//----------------------------------------------------------------------------------------------
	//	deleteFidget(container, fidget)
	//----------------------------------------------------------------------------------------------

	it("Deletes fidgets from screen", function ()
	{

		//	PREPARE
		//		Default parameters
		project.screens = [{
			id: undefined,
			type: undefined,
			containerLevel: -1,
			fidgets: [{}, {}]
		}, {
			id: undefined,
			type: enumServ.screenTypesEnum.Factory,
			containerLevel: 0,
			fidgets: [{}, {}, {
				source: "fidgetGroup",
				fidgets: [{}, {}, {}, {}]
			}]
		}];

		//	RUN
		project.deleteFidget(project.screens[0], project.screens[0].fidgets[1]);
		project.deleteFidget(
			project.screens[1].fidgets[2], project.screens[1].fidgets[2].fidgets[0]);
		project.deleteFidget(
			project.screens[1].fidgets[2], project.screens[1].fidgets[2].fidgets[1]);
		project.deleteFidget(
			project.screens[1].fidgets[2], project.screens[1].fidgets[2].fidgets[2]);

		//	VERIFY
		expect(project.screens[0].fidgets.length).toEqual(1);
		expect(project.screens[1].fidgets[2].fidgets.length).toEqual(1);

	});



	//----------------------------------------------------------------------------------------------
	//	runInit()
	//----------------------------------------------------------------------------------------------

	describe("Runs the initscript", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Mock compile function
			calledCompile = 0;
			scriptManager.compile = function (script) {
				calledCompile++;
				return script;
			};
			//	Mock popup's show function
			calledShow = 0;
			popup.show = function (text, type) {
				calledShow++;
				expect(type).toEqual(popup.types.error);
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Bad script", function ()
		{

			//	PREPARE
			project.initScript = "This is a bad script";

			//	RUN
			project.runInit();

			//	VERIFY
			expect(calledCompile).toEqual(1);
			expect(calledShow).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Good script", function ()
		{

			//	PREPARE
			project.initScript = "valtozo = 'This is a good script';";

			//	RUN
			project.runInit();

			//	VERIFY
			expect(calledCompile).toEqual(1);
			expect(calledShow).toEqual(0);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	setCurrentScreen(screen)
	//----------------------------------------------------------------------------------------------

	describe("Sets the current screen to the given one", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			project.screens = [{
				properties: { name: "Screen 0" }
			}, {
				properties: { name: "Screen 1" }
			}, {
				properties: { name: "Screen 2" }
			}, {
				properties: { name: "Screen 3" }
			}];

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("No screen", function ()
		{

			//	RUN
			project.setCurrentScreen(undefined);

			//	VERIFY
			expect(project.currentScreenIndex).toEqual(-1);
			expect(project.currentScreen).toEqual(undefined);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Select a screen", function ()
		{

			//	RUN
			project.setCurrentScreen(project.screens[2]);

			//	VERIFY
			expect(project.currentScreenIndex).toEqual(2);
			expect(project.currentScreen).toEqual(project.screens[2]);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	setCurrentScreenIndex(value)
	//----------------------------------------------------------------------------------------------

	it("Sets the screen index directly", function ()
	{

		//	PREPARE
		//		Default parameters
		selectedScreen = 2;
		project.screens = [{
			properties: { name: "Screen 0" }
		}, {
			properties: { name: "Screen 1" }
		}, {
			properties: { name: "Screen 2" }
		}, {
			properties: { name: "Screen 3" }
		}];
		//		Mock setCurrentScreen function
		calledCurrentScreen = 0;
		project.setCurrentScreen = function (screen) {
			calledCurrentScreen++;
			expect(project.screens[selectedScreen]);
		};

		//	RUN
		project.setCurrentScreenIndex(selectedScreen);

		//	VERIFY
		expect(calledCurrentScreen).toEqual(1);

	});



	//----------------------------------------------------------------------------------------------
	//	setCurrentScreenByName(value)
	//----------------------------------------------------------------------------------------------

	describe("Finds a screen with the given name and set it as current", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			selectedScreen = 2;
			project.screens = [{
				properties: { name: "Screen 0" }
			}, {
				properties: { name: "Screen 1" }
			}, {
				properties: { name: "Screen 2" }
			}, {
				properties: { name: "Screen 3" }
			}];
			//	Mock setCurrentScreen function
			calledCurrentScreen = 0;
			project.setCurrentScreen = function (screen) {
				calledCurrentScreen++;
				expect(project.screens[selectedScreen]);
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Can find", function ()
		{

			//	RUN
			project.setCurrentScreenByName("Screen 2");

			//	VERIFY
			expect(calledCurrentScreen).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Can't find", function ()
		{

			//	PREPARE
			selectedScreen = 0;

			//	RUN
			project.setCurrentScreenByName("Some random name");

			//	VERIFY
			expect(calledCurrentScreen).toEqual(1);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	getCurrentScreen()
	//----------------------------------------------------------------------------------------------

	describe("Sets currentScreen to currentScreenIndex", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			project.screens = [{
				properties: { name: "Screen 0" }
			}, {
				properties: { name: "Screen 1" }
			}, {
				properties: { name: "Screen 2" }
			}, {
				properties: { name: "Screen 3" }
			}];

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Get a defined screen", function ()
		{

			//	PREPARE
			project.currentScreenIndex = 2;

			//	RUN
			project.getCurrentScreen();

			//	VERIFY
			expect(project.currentScreen).toEqual(project.screens[project.currentScreenIndex]);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Get an undefined screen (large)", function ()
		{

			//	PREPARE
			project.currentScreenIndex = 5;

			//	RUN
			project.getCurrentScreen();

			//	VERIFY
			expect(project.currentScreen).toEqual(project.screens[project.screens.length - 1]);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Get an undefined screen (small)", function () {

			//	PREPARE
			project.currentScreenIndex = -5;

			//	RUN
			project.getCurrentScreen();

			//	VERIFY
			expect(project.currentScreen).toEqual(project.screens[0]);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	addScreen(type)
	//----------------------------------------------------------------------------------------------
//TODO:	check backgroundTypes[..]

	describe("Adds a new screen to the project", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function () {

			//	Default parameters
			project.screens = [{
				properties: { name: "Screen 0" }
			}, {
				properties: { name: "Screen 1" }
			}, {
				properties: { name: "Screen 2" }
			}, {
				properties: { name: "Screen 3" }
			}];

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Adds a new screen", function ()
		{

			//	RUN
			ret = project.addScreen(enumServ.screenTypesEnum.Normal);

			//	VERIFY
			expect(project.screens.length).toEqual(5);
			expect(project.screens[project.screens.length - 1]).toEqual(ret);
			expect(project.screens[project.screens.length - 1].properties.name).toEqual(
				"New Screen");

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Adds a new factory screen", function ()
		{

			//	RUN
			ret = project.addScreen(enumServ.screenTypesEnum.Factory);

			//	VERIFY
			expect(project.screens.length).toEqual(5);
			expect(project.screens[project.screens.length - 1]).toEqual(ret);
			expect(project.screens[project.screens.length - 1].properties.name).toEqual(
				"New Factory");

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Adds many new screens", function ()
		{

			//	RUN
			for (var i = 0; i < 5; i++)
				ret = project.addScreen(enumServ.screenTypesEnum.Normal);

			//	VERIFY
			expect(project.screens.length).toEqual(9);
			expect(project.screens[project.screens.length - 1]).toEqual(ret);
			expect(project.screens[project.screens.length - 5].properties.name).toEqual(
				"New Screen");
			expect(project.screens[project.screens.length - 4].properties.name).toEqual(
				"New Screen 2");
			expect(project.screens[project.screens.length - 3].properties.name).toEqual(
				"New Screen 3");
			expect(project.screens[project.screens.length - 2].properties.name).toEqual(
				"New Screen 4");
			expect(project.screens[project.screens.length - 1].properties.name).toEqual(
				"New Screen 5");

		});

	});



	//----------------------------------------------------------------------------------------------
	//	findScreen(name)
	//----------------------------------------------------------------------------------------------

	describe("Finds a screen with the given name. Returns null if not found", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			project.screens = [{
				properties: { name: "Screen 0" }
			}, {
				properties: { name: "Screen 1" }
			}, {
				properties: { name: "Screen 2" }
			}, {
				properties: { name: "Screen 3" }
			}];

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Find an existing screen", function ()
		{

			//	RUN
			ret = project.findScreen("Screen 2");

			//	VERIFY
			expect(ret).toEqual(project.screens[2]);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Find an existing screen", function () {

			//	RUN
			ret = project.findScreen("Some random name");

			//	VERIFY
			expect(ret).toEqual(null);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	findScreenById(id)
	//----------------------------------------------------------------------------------------------

	describe("Finds a screen with the given id. Returns null if not found", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			project.screens = [{
				id: "Custom ID 0"
			}, {
				id: "Custom ID 1"
			}, {
				id: "Custom ID 2"
			}, {
				id: "Custom ID 3"
			}];

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Find an existing screen", function ()
		{

			//	RUN
			ret = project.findScreenById("Custom ID 2");

			//	VERIFY
			expect(ret).toEqual(project.screens[2]);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Find an existing screen", function ()
		{

			//	RUN
			ret = project.findScreenById("Some random ID");

			//	VERIFY
			expect(ret).toEqual(null);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	addDefaultScreens()
	//----------------------------------------------------------------------------------------------

	it("Adds the default screens to the project", function ()
	{

		//	PREPARE
		//		Mock getJSON function
		calledGetJSON = 0;
		$.getJSON = function (filename, fn) {
			calledGetJSON++;
			expect(filename).toEqual("project.json");
			data = 123;
			fn(data);
		};
		//		Mock load function
		calledLoad = 0;
		project.load = function (proj) {
			calledLoad++;
			expect(proj).toEqual(123);
		};

		//	RUN
		project.addDefaultScreens();

		//	VERIFY
		expect(calledGetJSON).toEqual(1);
		expect(calledLoad).toEqual(1);

	});



	//----------------------------------------------------------------------------------------------
	//	load(proj)
	//----------------------------------------------------------------------------------------------

	describe("Loads a given project", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			myProject = {
				screens: [{}, {}, {}],
				name: "name",
				id: "id",
				changeScripts: "scprits",
				backgroundImage: "img",
				interfaceMetaDataList: 234,
				initScript: "init script"
			};
			project.currentScreen = {};
			project.currentScreenIndex = -1;
			project.screens = [{}];
			//	Mock runInit function
			calledRunInit = 0;
			project.runInit = function () {
				calledRunInit++;
			};
			//	Mock setupFidgets function
			calledSetupFidgets = 0;
			project.setupFidgets = function () {
				calledSetupFidgets++;
			};
			//	Mock setCurrentScreenIndex function
			calledCurrentScreenIndex = 0;
			project.setCurrentScreenIndex = function (value) {
				calledCurrentScreenIndex++;
				expect(value).toEqual(0);
			};
			//	Mock setCurrentScreenByName function
			calledCurrentScreenByName = 0;
			project.setCurrentScreenByName = function (name) {
				calledCurrentScreenByName++;
			};
			//	Mock findScreen function
			calledFindScreen = 0;
			project.findScreen = function (name) {
				calledFindScreen++;
				return true;
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Loads a project after initializing", function ()
		{

			//	RUN
			project.load(myProject);

			//	VERIFY
			expect(calledRunInit).toEqual(1);
			expect(calledSetupFidgets).toEqual(1);
			expect(calledCurrentScreenIndex).toEqual(1);
			expect(calledFindScreen).toEqual(0);
			expect(calledCurrentScreenByName).toEqual(0);
			expect(calledRootLocationPath).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Loads a project without setting current screen to 0", function ()
		{

			//	PREPARE
			project.currentScreenIndex = 5;

			//	RUN
			project.load(myProject);

			//	VERIFY
			expect(calledRunInit).toEqual(1);
			expect(calledSetupFidgets).toEqual(1);
			expect(calledCurrentScreenIndex).toEqual(0);
			expect(calledFindScreen).toEqual(0);
			expect(calledCurrentScreenByName).toEqual(0);
			expect(calledRootLocationPath).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Loads project and loads cookies", function ()
		{

			//	PREPARE
			//		Mock $rootScope's startPage	[AngularJS]
			rootScope.startPage = 1;
			//		Mock $rootScope's sessionCookie	[AngularJS]
			rootScope.sessionCookie = 2;

			//	RUN
			project.load(myProject);

			//	VERIFY
			expect(calledRunInit).toEqual(1);
			expect(calledSetupFidgets).toEqual(1);
			expect(calledCurrentScreenIndex).toEqual(1);
			expect(calledFindScreen).toEqual(1);
			expect(rootScope.startPage).toEqual(undefined);
			expect(calledCurrentScreenByName).toEqual(1);
			expect(calledRootLocationPath).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4
		//

		it("Loads project and loads cookies without define location", function ()
		{

			//	PREPARE
			//		Mock $rootScope's sessionCookie	[AngularJS]
			rootScope.sessionCookie = 2;

			//	RUN
			project.load(myProject);

			//	VERIFY
			expect(calledRunInit).toEqual(1);
			expect(calledSetupFidgets).toEqual(1);
			expect(calledCurrentScreenIndex).toEqual(1);
			expect(calledFindScreen).toEqual(1);
			expect(rootScope.startPage).toEqual(undefined);
			expect(calledCurrentScreenByName).toEqual(0);
			expect(calledRootLocationPath).toEqual(2);	//	Once with substring, once without it

		});

	});



	//----------------------------------------------------------------------------------------------
	//	screenTypes.action()
	//----------------------------------------------------------------------------------------------

	it("Adds a new screen", function ()
	{

		//	PREPARE
		//		Mock addScreen function
		calledAddScreen = 0;
		project.addScreen = function (type) {
			calledAddScreen++;
			expect(type).toEqual(enumServ.screenTypesEnum.Normal);
		};
		//		Mock showAddScreen function
		calledShowAddScreen = 0;
		project.showAddScreen = function (val) {
			calledShowAddScreen++;
			expect(val).toEqual(false);
		};

		//	RUN
		project.screenTypes[0].action();

		//	VERIFY
		expect(calledAddScreen).toEqual(1);
		expect(calledShowAddScreen).toEqual(1);

	});

});
