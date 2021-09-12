////////////////////////////////////////////////////////////////////////////////////////////////////
//	Creator:		NYP
//	Update:			2016.04.25
//	Description:	This is a UNIT test for scripts/editHandler.js
//	Last checked:	3133
////////////////////////////////////////////////////////////////////////////////////////////////////



describe("Editor Service Test", function ()
{

	//----------------------------------------------------------------------------------------------
	//  Define default mock functions/classes, create new instances of services
	//----------------------------------------------------------------------------------------------

	beforeEach(function ()
	{

		//	Default setTimeout function
		setTimeout = window.setTimeout;

		//	Default position for events
		event = {
			clientX: 123,
			clientY: 234
		};

		//	mock $rootScope
		rootScope = {
			$on: function () { },
			$watch: function () { },
			addModal: function () { },
			extraButtonsForSettingsWindow: []
		};
		//	mock $rootLocation
		rootLocation = {
			$path: function () { }
		};
		//	mock $window
		windowObj = {
			innerWidth: 890
		};
		//	mock $injector
		injector = {
		};
		//	mock $sce
		sce = {
			trustAsResourceUrl: function () { }
		};
		//	mock $http
		http = {
		};

		//	mock $timeout function
		timeout = function (fn, t, bool) {
		};
		//	mock refresh function (to prevent 404 warnings in settingsWindowHandler.js)
		less.refresh = function (bool) {
		};

		editor = {};
		
		enumServ =			enumService();
		popup =				popupService();		//	/scripts/popupHandler.js
		variable =			variableService();
		colorPicker =		colorPickerService();	//	/scripts/colorPickerHandler.js
		scriptManager =		scriptManagerService(popup, variable);	//	/scripts/scriptManager.js
		fidget =			fidgetService(enumServ, variable, colorPicker, scriptManager, sce, http,
								timeout);	//	/scripts/fidgetTemplates.js
		background =		backgroundService(rootScope, colorPicker);
		project =			projectService(rootScope, enumServ, fidget, popup, rootLocation,
								scriptManager, variable, setTimeout, background);	//	/scripts/projectModel.js
		historyServ =		historyService(project);	//	/scripts/historyHandler.js
		device =			deviceService(rootScope, historyServ, project, variable, popup,
								scriptManager, fidget);		//	/scripts/deviceModel.js
		clipboard =			clipboardService(project, device, fidget);		//	/scripts/clipboardHandler.js
		settingsWindow =	settingsWindowService(project, device, popup, rootScope);		//	/scripts/settingsWindowHandler.js
		user =				userService(rootScope, enumServ, popup, editor, timeout, settingsWindow,
								injector, sce);		//	/addons/multiUser/userService.js
		editor =			editorService(timeout, rootScope, windowObj, historyServ, project,
								enumServ, fidget, device, clipboard, settingsWindow, popup);		//	/scripts/editHandler.js

		//	Default parameters of editor
		editor.beltWidth = 50;

	});



	//----------------------------------------------------------------------------------------------
	//	modes.move
	//----------------------------------------------------------------------------------------------

	describe("Tests all functions in modes.move", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			myEvent = {};
			myMousePos = {
				x: editor.windowWidth - editor.beltWidth + 1
			};
			myFidgets = [{
				parent: {
					top: 111,
					left: 222
				},
				posBeforeDrag: {
					top: 123,
					left: 234
				},
				top: 12,
				left: 23
			}, {
				parent: 3,
				posBeforeDrag: {
					top: 1234,
					left: 2345
				},
				top: 1,
				left: 2
			}];
			editor.selectedFidgets = myFidgets;
			//	Mock getMousePos function
			calledGetMousePos = 0;
			editor.getMousePos = function (event) {
				calledGetMousePos++;
				return myMousePos;
			};
			//	Mock deleteFidget function
			calledDeleteFidget = 0;
			project.deleteFidget = function (container, fidget) {
				calledDeleteFidget++;
				expect(container).toEqual(editor.selectedFidgets[calledDeleteFidget - 1].parent);
				expect(fidget).toEqual(editor.selectedFidgets[calledDeleteFidget - 1]);
			};
			//	Mock saveProject function
			calledSaveProject = 0;
			device.saveProject = function (saveHistory) {
				calledSaveProject++;
				expect(saveHistory).toBeTruthy();
			};
			//	Mock setPropertiesWindowVisible function
			calledSetPropertiesWindowVisible = 0;
			editor.setPropertiesWindowVisible = function (value, doNotSave) {
				calledSetPropertiesWindowVisible++;
				expect(value).toBeTruthy();
			};
			//	Mock show function
			calledShow = 0;
			popup.show = function (text, type) {
				calledShow++;
				expect(text).toEqual(localization.currentLocal.properties.onlyForSingleFidget);
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1:	onMouseUp($event)
		//

		it("Delete fidgets if the mouse is over the delete belt", function ()
		{

			//	RUN
			editor.modes.move.onMouseUp(myEvent);

			//	VERIFY
			expect(calledGetMousePos).toEqual(1);
			expect(calledDeleteFidget).toEqual(2);
			expect(editor.selectedFidgets.length).toEqual(0);
			expect(calledSaveProject).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2:	onMouseUp($event)
		//

		it("Open property window if there is only 1 selected fidget", function ()
		{

			//	PREPARE
			myMousePos.x = editor.beltWidth - 1;
			editor.selectedFidgets.splice(1, 1);

			//	RUN
			editor.modes.move.onMouseUp(myEvent);

			//	VERIFY
			expect(calledGetMousePos).toEqual(1);
			expect(calledDeleteFidget).toEqual(0);
			expect(editor.editedFidget).toEqual(editor.selectedFidgets[0]);
			expect(calledSetPropertiesWindowVisible).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3:	onMouseUp($event)
		//

		it("Open property window if there is more than one selected fidget", function ()
		{

			//	PREPARE
			myMousePos.x = editor.beltWidth - 1;

			//	RUN
			editor.modes.move.onMouseUp(myEvent);

			//	VERIFY
			expect(calledGetMousePos).toEqual(1);
			expect(calledDeleteFidget).toEqual(0);
			expect(calledShow).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4:	onMouseUp($event)
		//

		it("Update position", function ()
		{

			//	PREPARE
			myMousePos.x = editor.beltWidth + 1;

			//	RUN
			editor.modes.move.onMouseUp(myEvent);

			//	VERIFY
			expect(calledGetMousePos).toEqual(1);
			expect(calledDeleteFidget).toEqual(0);
			for (var i = 0; i < editor.selectedFidgets.length; i++)
			{
				expect(editor.selectedFidgets[i].posBeforeDrag.top).toEqual(myFidgets[i].top);
				expect(editor.selectedFidgets[i].posBeforeDrag.left).toEqual(myFidgets[i].left);
			}
			expect(calledSaveProject).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 5:	onMouseUp($event)
		//

		it("Update position and change parent", function ()
		{

			//	PREPARE
			myMousePos.x = editor.beltWidth + 1;
			editor.activeContainer = {
				fidgets: [],
				containerLevel: 2,
				top: 12345,
				left: 23456
			};

			//	RUN
			editor.modes.move.onMouseUp(myEvent);

			//	VERIFY
			expect(calledGetMousePos).toEqual(1);
			expect(calledDeleteFidget).toEqual(2);	//	Two selected fidgets
			expect(editor.activeContainer.fidgets).toEqual(editor.selectedFidgets);
			for (var i = 0; i < editor.selectedFidgets.length; i++)
			{
				expect(editor.selectedFidgets[i].parent).toEqual(editor.activeContainer);
				expect(editor.selectedFidgets[i].containerLevel).toEqual(
					editor.activeContainer.containerLevel + 1);
				expect(editor.selectedFidgets[i].top).toEqual(
					myFidgets[i].top - editor.activeContainer.top + myFidgets[i].parent.top);
				expect(editor.selectedFidgets[i].left).toEqual(
					myFidgets[i].left - editor.activeContainer.left + myFidgets[i].parent.left);
				expect(editor.selectedFidgets[i].posBeforeDrag.top).toEqual(myFidgets[i].top);
				expect(editor.selectedFidgets[i].posBeforeDrag.left).toEqual(myFidgets[i].left);
			}
			expect(calledSaveProject).toEqual(1);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	getAction(label, onTap, icon, forScreenType)
	//----------------------------------------------------------------------------------------------

	it("Creates an action object", function ()
	{

		//	PREPARE
		var ret = {
			label: undefined,
			icon: undefined,
			onTap: undefined,
			enabled: undefined,
			forScreenType: undefined
		};

		//	RUN
		ret = editor.getAction("label", "onTap", "icon", "forScreenType");

		//	VERIFY
		expect(ret.label).toEqual("label");
		expect(ret.icon).toEqual("icon");
		expect(ret.onTap).toEqual("onTap");
		expect(ret.enabled).toBeTruthy();
		expect(ret.forScreenType).toEqual("forScreenType");
//TODO:	test if forScreenType can return enumService.screenTypesEnum.All

	});



	//----------------------------------------------------------------------------------------------
	//	switchEditMode()
	//	switchMultiSelect()
	//----------------------------------------------------------------------------------------------

	describe("Tests all mode switches", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Mock modes.move.enable function
			calledMmEnable = 0;
			editor.modes.move.enable = function () {
				calledMmEnable++;
			};
			//	Mock saveProject function
			calledSaveProject = 0;
			device.saveProject = function (saveHistory) {
				calledSaveProject++;
			};
			//	Mock addWatchers function
			calledAddWatchers = 0;
			editor.addWatchers = function () {
				calledAddWatchers++;
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	switchEditMode()
		//

		it("Opens and leaves edit mode", function ()
		{

			//	VERIFY (not edit mode)
			expect(editor.isEditMode).toBeFalsy();

			//	RUN (edit mode ON)
			editor.switchEditMode();

			//	VERIFY
			expect(editor.isEditMode).toBeTruthy();
			expect(calledMmEnable).toEqual(1);
			expect(editor.isMultiSelect).toBeFalsy();
			expect(editor.selectedFidgets.length).toEqual(0);
			expect(calledSaveProject).toEqual(1);
			expect(calledAddWatchers).toEqual(1);

			//	RUN (edit mode OFF)
			editor.switchEditMode();

			//	VERIFY
			expect(editor.isEditMode).toBeFalsy();
			expect(calledMmEnable).toEqual(2);
			expect(editor.isMultiSelect).toBeFalsy();
			expect(editor.selectedFidgets.length).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	switchMultiSelect()
		//

		it("Switches between multi select modes", function ()
		{

			//	VERIFY (normal mode)
			expect(editor.isMultiSelect).toBeFalsy();

			//	RUN (normal => multiSelect)
			editor.switchMultiSelect();

			//	VERIFY
			expect(editor.isMultiSelect).toBeTruthy();

			//	RUN (multiSelect => normal)
			editor.selectedFidgets = [1, 2, 3, 4, 5];
			editor.switchMultiSelect();

			//	VERIFY
			expect(editor.isMultiSelect).toBeFalsy();
			expect(editor.selectedFidgets.length).toEqual(1);	//	Leaves 1 item from the selected list

		});

	});



	//----------------------------------------------------------------------------------------------
	//	setFidgetPosition(fidget, mousePos)
	//----------------------------------------------------------------------------------------------

	it("Set fidget position", function ()
	{

		//	PREPARE
		//		Default parameters
		myFidget = {
			posBeforeDrag: {
				top: 123,
				left: 234
			}
		};
		mousePos = {
			y: 12,
			x: 23
		};
		editor.mouseDownPos = {
			y: 1234,
			x: 2345
		};

		//	RUN
		editor.setFidgetPosition(myFidget, mousePos);

		//	VERIFY
		expect(myFidget.left).toEqual(myFidget.posBeforeDrag.left + mousePos.x -
			editor.mouseDownPos.x);
		expect(myFidget.top).toEqual(myFidget.posBeforeDrag.top + mousePos.y -
			editor.mouseDownPos.y);

	});



	//----------------------------------------------------------------------------------------------
	//	unselectAll()
	//----------------------------------------------------------------------------------------------

	it("Clears selections", function ()
	{

		//	PREPARE
		editor.selectedFidgets = [1, 2, 3, 4, 5];

		//	RUN
		editor.unselectAll();

		//	VERIFY
		expect(editor.selectedFidgets.length).toEqual(0);

	});



	//----------------------------------------------------------------------------------------------
	//	disableClearSelection()
	//----------------------------------------------------------------------------------------------

	it("Disables to remove the selection clear", function()
	{

		//	PREPARE
		editor.clearSelectionTimer = {};
		//		Mock clearTimeout function
		calledClearTimeout = 0;
		clearTimeout = function (timer) {
			calledClearTimeout++;
			expect(timer).toEqual({});
		};

		//	RUN
		editor.disableClearSelection();

		//	VERIFY
		expect(editor.clearSelectionTimer).toEqual(undefined);
		expect(calledClearTimeout).toEqual(1);

	});



	//----------------------------------------------------------------------------------------------
	//	getMousePos($event)
	//----------------------------------------------------------------------------------------------

	describe("Tap event for the wholescreen", function ()
	{

		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Gets mouse position with undefined event", function ()
		{

			//	RUN
			ret = editor.getMousePos(undefined);
			
			//	VERIFY
			expect(ret.x).toEqual(event.clientX);
			expect(ret.y).toEqual(event.clientY);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Gets mouse position of a custom event", function ()
		{

			//	PREPARE
			myEvent = {
				center: {
					left: 123,
					top: 234
				}
			};

			//	RUN
			ret = editor.getMousePos(myEvent);	//	myEvent.center has left,top parameters

			//	VERIFY
			expect(ret.x).toEqual(myEvent.center.x);	//	The function replaced left to x
			expect(ret.y).toEqual(myEvent.center.y);	//	The function replaced top to y

			//	RUN
			ret = editor.getMousePos(myEvent);	//	myEvent.center has x,y parameters now

			//	VERIFY
			expect(ret.x).toEqual(myEvent.center.x);
			expect(ret.y).toEqual(myEvent.center.y);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	onScreenTap($event)
	//----------------------------------------------------------------------------------------------

	describe("Tap event for the wholescreen", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Set mouse position
			myEvent = {
				center: {
					left: 123,
					top: 234
				}
			};

			//		Mock onFidgetMouseDown function
			calledFidgetMouseDown = 0;
			editor.onFidgetMouseDown = function (closestFidget, event, bool) {
				calledFidgetMouseDown++;
				expect(closestFidget).toBeTruthy();
				expect(event).toEqual(myEvent);
				expect(bool).toBeTruthy();
			};

			//		Mock setTimeout function
			calledTimeout = 0;
			setTimeout = function (fn, t, bool) {
				calledTimeout++;
				expect(t).toEqual(20);
				fn();
			};

			//	Turn edit mode on
			if (!editor.isEditMode)
				editor.isEditMode = true;

			//	VERIFY (edit mode)
			expect(editor.isEditMode).toBeTruthy();

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("getClosestFidget returns true", function ()
		{

			//	PREPARE
			//		Mock getClosestFidget function
			calledClosestFidget = 0;
			editor.getClosestFidget = function (mousePos, myEvent) {
				calledClosestFidget++;
				return true;
			};

			//	RUN
			editor.onScreenTap(myEvent);

			//	VERIFY
			expect(calledClosestFidget).toEqual(1);
			expect(calledFidgetMouseDown).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("getClosestFidget returns false", function ()
		{

			//	PREPARE
			//		Mock getClosestFidget function
			calledClosestFidget = 0;
			editor.getClosestFidget = function (mousePos, myEvent) {
				calledClosestFidget++;
				return false;
			};
			//		Set selected fidgets to not []
			editor.selectedFidgets = [1, 2, 3, 4, 5];

			//	RUN
			editor.onScreenTap(myEvent);

			//	VERIFY
			expect(calledClosestFidget).toEqual(1);
			expect(calledFidgetMouseDown).toEqual(0);	//	Not called if getClosestFidget is false
			expect(calledTimeout).toEqual(1);
			expect(editor.selectedFidgets).toEqual([]);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	getFidgetSize(fidget)
	//----------------------------------------------------------------------------------------------

	describe("Returns the fidget's size", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Define a custom fidget
			myFidget = {
				source: "something",
				id: "1234",
				properties: {
					width: 123,
					height: 234
				}
			}

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Normal fidget", function ()
		{

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(123);
			expect(ret.height).toEqual(234);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Text fidget", function ()
		{

			//	PREPARE
			myFidget.source = "text";

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Fidget's width is incorrect", function ()
		{

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).not.toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).not.toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 1
			myFidget.properties.width = 0;

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 2
			myFidget.properties.width = undefined;

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 3
			myFidget.properties.width = null;

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 4
			myFidget.properties.width = "undefined";

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4
		//

		it("Fidget's height is incorrect", function ()
		{

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).not.toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).not.toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 1
			myFidget.properties.height = 0;

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 2
			myFidget.properties.height = undefined;

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 3
			myFidget.properties.height = null;

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

			//	PREPARE 4
			myFidget.properties.height = "undefined";

			//	RUN
			ret = editor.getFidgetSize(myFidget);

			//	VERIFY
			expect(ret.width).toEqual(null);	//	There is no $(#1234) element
			expect(ret.height).toEqual(null);	//	There is no $(#1234) element

		});

	});



	//----------------------------------------------------------------------------------------------
	//	getClosestFidget(fidget)
	//----------------------------------------------------------------------------------------------

	describe("Gets the closest fidget under the cursor", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters of function
			mousePos = {
				x: 123,
				y: 234
			};
			myEvent = undefined;
			skipSelected = false;

			//	Mock onResizeFidget function
			calledResizeFidget = 0;
			expectedName = undefined;
			editor.onResizeFidget = function (corner, $event) {
				calledResizeFidget++;
				expect(corner).toEqual(expectedName);
				expect($event).toEqual(myEvent);
			};

			//	Fidgets on current screen
			project.currentScreen = {
				fidgets: [{
					properties: {
						width: 123,
						height: 234
					},
					top: 111,
					left: 222,
					parent: {
						properties: {
							width: 12,
							height: 23
						},
						top: 11,
						left: 22,
						parent: project.currentScreen
					}
				}, {
					properties: {
						width: 1234,
						height: 2345
					},
					top: 1111,
					left: 2222
				}]
			};

			//	Every test uses the same function to RUN and VERIFY
			runVerify = function (expectedFidget) {

				//	RUN
				ret = editor.getClosestFidget(mousePos, myEvent, skipSelected);

				//	VERIFY
				if (expectedFidget == undefined)
					expect(ret).toEqual(undefined);
				else
					expect(ret.properties).toEqual(
						project.currentScreen.fidgets[expectedFidget].properties);

			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Rotate fidget", function ()
		{

			//	PREPARE
			calledOnGetFidget = 0;
			editor.currentMode = {
				onGetFidgets: function (mousePos, $event, skipSelected, rot) {
					calledOnGetFidget++;
					return 5;
				}
			};

			//	RUN
			ret = editor.getClosestFidget(mousePos, myEvent, skipSelected);

			//	VERIFY
			expect(ret).toEqual(5);
			expect(calledOnGetFidget).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Select first fidget", function ()
		{

			//	PREPARE
			//		We expect that these mouse settings will result the first fidget
			mousePos = {
				x: project.currentScreen.fidgets[0].left + 25,
				y: project.currentScreen.fidgets[0].top + 25
			};

			//	RUN & VERIFY
			runVerify(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Select first fidget with safety distance", function ()
		{

			//	PREPARE
			//		We expect that these mouse settings will result the first fidget
			mousePos = {
				x: project.currentScreen.fidgets[0].left - 25,
				y: project.currentScreen.fidgets[0].top - 25
			};

			//	RUN & VERIFY
			runVerify(0);
//TODO:	check if it was really selected using the safety distance

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4
		//

		it("Select second fidget", function ()
		{

			//	PREPARE
			//		We expect that these mouse settings will result the second fidget
			mousePos = {
				x: project.currentScreen.fidgets[1].left + 25,
				y: project.currentScreen.fidgets[1].top + 25
			};

			//	RUN & VERIFY
			runVerify(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 5
		//

		it("Select second fidget with safety distance", function ()
		{

			//	PREPARE
			//		We expect that these mouse settings will result the second fidget
			mousePos = {
				x: project.currentScreen.fidgets[1].left - 25,
				y: project.currentScreen.fidgets[1].top - 25
			};

			//	RUN & VERIFY
			runVerify(1);
//TODO:	check if it was really selected using the safety distance

		});



		//------------------------------------------------------------------------------------------
		//	TEST 6
		//

		it("If second fidget is selected, skip it", function ()
		{

			//	PREPARE
			//		We expect that these mouse settings will result the second fidget
			mousePos = {
				x: project.currentScreen.fidgets[1].left + 25,
				y: project.currentScreen.fidgets[1].top + 25
			};
			//		Select second fidget and set to skip selected fidget
			skipSelected = true;
			editor.selectedFidgets = [project.currentScreen.fidgets[1]];

			//	RUN & VERIFY
			runVerify(undefined);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	setPropertiesWindowVisible(value, doNotSave)
	//----------------------------------------------------------------------------------------------

	describe("Set properties window visible", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Mock loadState function
			calledLoadState = 0;
			historyServ.loadState = function (proj, callback) {
				calledLoadState++;
			};

			//	Mock generateIndexImage function
			calledGenerateIndexImage = 0;
			project.generateIndexImage = function (screen, callback) {
				calledGenerateIndexImage++;
				expect(screen).toEqual(project.currentScreen);
				if (callback) callback();
			};

			//	Mock saveProject function
			calledSaveProject = 0;
			device.saveProject = function (saveHistory) {
				calledSaveProject++;
				expect(saveHistory).toBeTruthy();
			};

			//	Prepare function for fidget tests
			openPropWindow = function (k)
			{

				//	PREPARE
				editor.editedFidget = angular.copy(fidget.templates[k]);

				//	RUN
				editor.setPropertiesWindowVisible(true);	//	Open first so temp data is written

				//	VERIFY
				expect(editor._tempFidget).toEqual(fidget.templates[k]);	//	Test temp data
				expect(editor._tempFidget.properties).toEqual(editor.editedFidget.properties);

			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Open properties window", function ()
		{

			//	RUN
			editor.setPropertiesWindowVisible(true);

			//	VERIFY
			expect(editor.propertiesWindowVisible).toBeTruthy();

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Close properties window of current screen & don't save", function ()
		{

			//	PREPARE
			editor.editedFidget = project.currentScreen;	//	Sets saveProject to true

			//	RUN
			editor.setPropertiesWindowVisible(false, true);	//	Ask to not save the project

			//	VERIFY
			expect(editor.propertiesWindowVisible).toBeFalsy();
			expect(calledLoadState).toEqual(1);	//	Reloads history because it was asked to not save

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Close properties window of current screen & save", function ()
		{

			//	PREPARE
			editor.editedFidget = project.currentScreen;	//	Sets saveProject to true

			//	RUN
			editor.setPropertiesWindowVisible(false, false);

			//	VERIFY
			expect(editor.propertiesWindowVisible).toBeFalsy();
			expect(calledLoadState).toEqual(0);
			expect(calledGenerateIndexImage).toEqual(1);	//	Regenerate index image
			expect(calledSaveProject).toEqual(1);	//	Saves project after generating the image

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4
		//

		it("Close fidget propertes window & don't save", function ()
		{

			//	Test all fidgets
			var i = 0;
			for (var k in fidget.templates)
			{

				//	PREPARE
				i++;
				openPropWindow(k);

				//	RUN
				editor.setPropertiesWindowVisible(false, true);

				//	VERIFY
				expect(editor.propertiesWindowVisible).toBeFalsy();
				expect(calledLoadState).toEqual(i);	//	Reloads history every time

			}

		});



		//------------------------------------------------------------------------------------------
		//	TEST 5
		//

		it("Close fidget propertes window & save (no changes in parameters)", function ()
		{

			//	Test all fidgets
			var i = 0;
			for (var k in fidget.templates)
			{

				//	PREPARE
				i++;
				openPropWindow(k);

				//	RUN
				editor.setPropertiesWindowVisible(false, false);	//	Ask to not save the project

				//	VERIFY
				expect(editor.propertiesWindowVisible).toBeFalsy();
				expect(calledLoadState).toEqual(0);
				expect(calledGenerateIndexImage).toEqual(0);	//	Doesn't regenerate index image
				expect(calledSaveProject).toEqual(0);	//	Doesn't save the project

			}

		});



		//------------------------------------------------------------------------------------------
		//	TEST 6
		//

		it("Close fidget propertes window & save (no changes in parameters)", function ()
		{

			//	Test all fidgets
			var i = 0;
			for (var k in fidget.templates)
			{

				//	PREPARE
				i++;
				openPropWindow(k);
				//		Change a parameter
				editor.editedFidget.properties._width = 123;

				//	RUN
				editor.setPropertiesWindowVisible(false, false);	//	Ask to not save the project

				//	VERIFY
				expect(editor.propertiesWindowVisible).toBeFalsy();
				expect(calledLoadState).toEqual(0);
				expect(calledGenerateIndexImage).toEqual(i);	//	Regenerate index image
				expect(calledSaveProject).toEqual(i);	//	Saves project after generating the image

			}

		});

	});



	//----------------------------------------------------------------------------------------------
	//	onMouseDown($event)
	//----------------------------------------------------------------------------------------------

	describe("Mouse down event", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Define default parameters
			myEvent = undefined;

			//	Mock getClosestFidget function
			calledClosestFidget = 0;
			editor.getClosestFidget = function () {
				calledClosestFidget++;
				return {
					properties: {
						width: 123,
						height: 234
					},
					top: 111,
					left: 222,
				};
			};

			//	Mock onFidgetMouseDown function
			calledFidgetMouseDown = 0;
			editor.onFidgetMouseDown = function (fidget, $event, canRemoveSelection) {
				calledFidgetMouseDown++;
			};

			//	Mock disableClearSelection function
			calledDisableClearSelection = 0;
			editor.disableClearSelection = function () {
				calledDisableClearSelection++;
			};

			//	Mock currentMode.onMouseDown function
			calledCmMouseDown = 0;
			editor.currentMode = {
				onMouseDown: function (event) {
					calledCmMouseDown++;
					expect(event).toEqual(myEvent);
				}
			};
			//	Mock modes.move.onMouseDown function
			calledMmMouseDown = 0;
			editor.modes.move.onMouseDown = function (event) {
				calledMmMouseDown++;
				expect(event).toEqual(myEvent);
			};

			//	Turn edit mode on
			if (!editor.isEditMode)
				editor.isEditMode = true;

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Mouse down on a fidget", function ()
		{

			//	RUN
			editor.onMouseDown(myEvent);

			//	VERIFY
			expect(calledClosestFidget).toEqual(1);
			expect(calledFidgetMouseDown).toEqual(1);
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.isMouseDown).toBeTruthy();
			expect(editor.mouseDownPos).toEqual({
				x: event.clientX,
				y: event.clientY
			});
			expect(calledCmMouseDown).toEqual(1);
			expect(calledMmMouseDown).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Mouse down on a fidget, current mode is undefined", function ()
		{

			//	PREPARE
			delete editor.currentMode;

			//	RUN
			editor.onMouseDown(myEvent);

			//	VERIFY
			expect(calledClosestFidget).toEqual(1);
			expect(calledFidgetMouseDown).toEqual(1);
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.isMouseDown).toBeTruthy();
			expect(editor.mouseDownPos).toEqual({
				x: event.clientX,
				y: event.clientY
			});
			expect(calledCmMouseDown).toEqual(0);
			expect(calledMmMouseDown).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Mouse down on the screen", function ()
		{

			//	PREPARE
			//		Mock getClosestFidget function
			editor.getClosestFidget = function () {
				calledClosestFidget++;
				return undefined;
			};

			//	RUN
			editor.onMouseDown(myEvent);

			//	VERIFY
			expect(calledClosestFidget).toEqual(1);
			expect(calledFidgetMouseDown).toEqual(0);	//	There is no fidget
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.isMouseDown).toBeTruthy();
			expect(editor.mouseDownPos).toEqual({
				x: event.clientX,
				y: event.clientY
			});
			expect(calledCmMouseDown).toEqual(1);
			expect(calledMmMouseDown).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4
		//

		it("Mouse down on the screen, current mode is undefined", function ()
		{

			//	PREPARE
			delete editor.currentMode;
			//		Mock getClosestFidget function
			editor.getClosestFidget = function () {
				calledClosestFidget++;
				return undefined;
			};

			//	RUN
			editor.onMouseDown(myEvent);

			//	VERIFY
			expect(calledClosestFidget).toEqual(1);
			expect(calledFidgetMouseDown).toEqual(0);	//	There is no fidget
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.isMouseDown).toBeTruthy();
			expect(editor.mouseDownPos).toEqual({
				x: event.clientX,
				y: event.clientY
			});
			expect(calledCmMouseDown).toEqual(0);
			expect(calledMmMouseDown).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 5
		//

		it("Mouse down on screen belt", function ()
		{

			//	PREPARE
			//		Mock getClosestFidget function
			editor.getClosestFidget = function () {
				calledClosestFidget++;
				return undefined;
			};
			//		Set other default mouse center position
			event.clientX = editor.beltWidth-1;

			//	RUN
			editor.onMouseDown(myEvent);

			//	VERIFY
			expect(calledClosestFidget).toEqual(1);
			expect(calledFidgetMouseDown).toEqual(0);	//	There is no fidget
			expect(calledDisableClearSelection).toEqual(0);	//	The code didn't reach this part
			expect(calledCmMouseDown).toEqual(0);
			expect(calledMmMouseDown).toEqual(0);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	onMouseUp($event)
	//----------------------------------------------------------------------------------------------

	describe("Mouse up event", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Define default parameters
			myEvent = undefined;
			if (!editor.isEditMode)
				editor.isEditMode = true;
			editor.mouseDownPos = {
				x: event.clientX,
				y: event.clientY
			};
			editor.isMouseDown = true;

			//	Mock currentMode.onMouseUp function
			calledCmMouseUp = 0;
			editor.currentMode = {
				onMouseUp: function (event) {
					calledCmMouseUp++;
					expect(event).toEqual(myEvent);
				}
			};
			//	Mock modes.move.onMouseUp function
			calledMmMouseUp = 0;
			editor.modes.move.onMouseUp = function (event) {
				calledMmMouseUp++;
				expect(event).toEqual(myEvent);
			};

			//	Mock active container parameter
			editor.activeContainer = 1;

		});



		//------------------------------------------------------------------------------------------
		//	VERIFY
		//

		afterEach(function ()
		{

			//	Verify after each test
			expect(editor.isMouseDown).toBeFalsy();
			expect(editor.activeContainer).toEqual(undefined);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Current mode exists", function ()
		{

			//	RUN
			editor.onMouseUp(myEvent);

			//	VERIFY
			expect(calledCmMouseUp).toEqual(1);
			expect(calledMmMouseUp).toEqual(0);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Current mode doesn't exist", function ()
		{

			//	PREPARE
			delete editor.currentMode;

			//	RUN
			editor.onMouseUp(myEvent);

			//	VERIFY
			expect(calledCmMouseUp).toEqual(0);
			expect(calledMmMouseUp).toEqual(1);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	onFidgetMouseDown(fidget, $event, canRemoveSelection)
	//----------------------------------------------------------------------------------------------

	describe("Mouse down on fidget putting it to the selection", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Define default parameters
			calledPreventDefault = 0;
			myEvent = {
				tapCount: 1,
				type: "panstart",
				preventDefault: function () {
					calledPreventDefault++;
				}
			};
			myFidget = {
				properties: {
					angle: Math.floor(Math.random()*90)
				},
				top: 123,
				left: 234,
				parent: 5,
				posBeforeDrag: {
					top: 123,
					left: 234
				}
			};

			//	Turn on edit mode
			if (!editor.isEditMode)
				editor.isEditMode = true;

			//	Mock disableClearSelection function
			calledDisableClearSelection = 0;
			editor.disableClearSelection = function(){
				calledDisableClearSelection++;
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST 1
		//

		it("Double tap rotation", function ()
		{

			//	PREPARE
			//		This is the second tap
			myEvent.tapCount = 2;

			for (var i = 0; i < 4; i++)	//	Check all 4 sides
			{

				//	PREPARE
				myFidget.properties.angle += 90;	//	First angle is between 90-180 degrees

				//	RUN
				editor.onFidgetMouseDown(myFidget, myEvent, true);

				//	VERIFY (angle after rotation)
				expect(myFidget.properties._angle).toEqual((i + 2) * 90 % 360);

			}

		});



		//------------------------------------------------------------------------------------------
		//	TEST 2
		//

		it("Simple tap rotation, multiselect is off", function ()
		{

			//	PREPARE
			//		Turn off multiselect
			if (editor.isMultiSelect)
				editor.switchMultiSelect();

			//	RUN
			editor.onFidgetMouseDown(myFidget, myEvent, true);

			//	VERIFY
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.selectedFidgets.length).toEqual(1);
			expect(editor.selectedFidgets[0].properties).toEqual(myFidget.properties);
			expect(editor.selectedFidgets[0].posBeforeDrag).toEqual({
				top: myFidget.top,
				left: myFidget.left
			});
			expect(calledPreventDefault).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 3
		//

		it("Simple tap rotation, multiselect is on, myFidget is selected", function ()
		{

			//	PREPARE
			//		Turn on multiselect
			if (!editor.isMultiSelect)
				editor.switchMultiSelect();
			//		Select myFidget
			editor.selectedFidgets.push(myFidget);

			//	RUN
			editor.onFidgetMouseDown(myFidget, myEvent, true);

			//	VERIFY
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.selectedFidgets.length).toEqual(0);
			expect(myFidget.posBeforeDrag).toEqual(undefined);
			expect(calledPreventDefault).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 4
		//

		it("Simple tap rotation, multiselect is on, myFidget's sibling is selected", function ()
		{

			//	PREPARE
			//		Turn on multiselect
			if (!editor.isMultiSelect)
				editor.switchMultiSelect();
			//		Select myFidget's child
			editor.selectedFidgets[0] = {
				parent: 5
			};

			//	RUN
			editor.onFidgetMouseDown(myFidget, myEvent, true);

			//	VERIFY
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.selectedFidgets.length).toEqual(2);
			expect(editor.selectedFidgets[1]).toEqual(myFidget);
			expect(myFidget.posBeforeDrag).toEqual({
				top: myFidget.top,
				left: myFidget.left
			});
			expect(calledPreventDefault).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST 5
		//

		it("Simple tap rotation, multiselect is on, myFidget's non-sibling is selected", function ()
		{

			//	PREPARE
			//		Turn on multiselect
			if (!editor.isMultiSelect)
				editor.switchMultiSelect();
			//		Select myFidget's child
			editor.selectedFidgets[0] = {
				parent: 4
			};

			//	RUN
			editor.onFidgetMouseDown(myFidget, myEvent, true);

			//	VERIFY
			expect(calledDisableClearSelection).toEqual(1);
			expect(editor.selectedFidgets.length).toEqual(1);
			expect(editor.selectedFidgets[0]).toEqual(myFidget);
			expect(myFidget.posBeforeDrag).toEqual({
				top: myFidget.top,
				left: myFidget.left
			});
			expect(calledPreventDefault).toEqual(1);

		});

	});



	//----------------------------------------------------------------------------------------------
	//	onFidgetTemplateMouseDown(template, $event)
	//----------------------------------------------------------------------------------------------

	it("Drag fidget from the belt", function ()
	{

		//	PREPARE
		//		Default parameters
		myEvent = undefined;
		myFidget = {
			top: 123,
			left: 234
		};
		project.currentScreen = {
			fidgets: []
		};
		//		Turn edit mode on
		if (!editor.isEditMode)
			editor.isEditMode = true;
		//		Mock getFidget function
		calledGetFidget = 0;
		fidget.getFidget = function (root, source, left, top, properties, icon, name, template) {
			calledGetFidget++;
			return myFidget;
		};

		i = 0;
		for (var k in fidget.templates)	//	Test every template
		{

			//	RUN
			editor.onFidgetTemplateMouseDown(fidget.templates[k], myEvent);

			//	VERIFY
			expect(calledGetFidget).toEqual(i+1);
			expect(myFidget.parent).toEqual(project.currentScreen);
			expect(myFidget.containerLevel).toEqual(1);
			expect(project.currentScreen.fidgets[i]).toEqual(myFidget);
			i++;
		}

		//	VERIFY
		expect(editor.selectedFidgets.length).toEqual(1);
		expect(editor.selectedFidgets[0]).toEqual(myFidget);
		expect(editor.selectedFidgets[0].posBeforeDrag).toEqual({
			top: myFidget.top,
			left: myFidget.left
		});
		expect(editor.currentMode).toEqual(null);
		expect(editor.isMultiSelect).toBeFalsy();

	});

//TODO:	Every function below onFidgetTemplateMouseDown (LINE 602)

		/*
		it("copies selected fidgets to the clipboard", function () {
			testObject = {value: 0};
			editor.selectedFidgets = [1, 2, 3, 4, 5, testObject];
			clipboardHandler.clipboard = [6, 7, 8];
	
			clipboardHandler.copy(editor.selectedFidgets);
			testObject.value++;
	
			//It removes previous items, copies new ones
			expect(clipboardHandler.clipboard.length).toEqual(6);
			//Check a new item
			expect(clipboardHandler.clipboard[0]).toEqual(1);
			//Check if changing the copied item after the copy affects the items on the clipboard
			expect(clipboardHandler.clipboard[5].value).toEqual(0);
		});
	
		it("cuts selected fidgets to the clipboard", function () {
			var saveProjectCalled = false;
			device.saveProject = function (saveHistory) {
				expect(saveHistory).toBeTruthy();
				saveProjectCalled = true;
			};
			var fidgets = [{parent: project.currentScreen, value: 1 },
			  {parent: project.currentScreen, value: 2 },
			  {parent: project.currentScreen, value: 3 },
			  {parent: project.currentScreen, value: 4 },
			  {parent: project.currentScreen, value: 5 }
			];
	
			project.currentScreen.fidgets = fidgets;
	
			editor.selectedFidgets = [fidgets[0], fidgets[2]];
			clipboardHandler.cut(editor.selectedFidgets);
	
			expect(saveProjectCalled).toBeTruthy();
			//It removes previous items, copies new ones
			expect(clipboardHandler.clipboard.length).toEqual(2);
			expect(fidgets.length).toEqual(3);
		});
	
		//it("covers all functions", function () {
		//    var functions = ['addAction', 'switchResizeMode', 'switchInRotate', 'switchEditMode', 'switchMultiSelect', 'copy', 'cut'];
		//    angular.forEach(Object.getOwnPropertyNames(editor), function (value) {
		//        if (typeof(editor[value]) == "function")
		//            expect(functions).toContain(value);
		//    });
		//
		//    rearrange();
		//});
	
		//    rearrange();
		//});*/
});
