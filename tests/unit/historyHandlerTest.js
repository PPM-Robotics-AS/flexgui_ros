////////////////////////////////////////////////////////////////////////////////////////////////////
//	Creator:		NYP
//	Update:			2016.04.11
//	Description:	This is a UNIT test for scripts/historyHandler.js
//	Last checked:	3127
////////////////////////////////////////////////////////////////////////////////////////////////////



describe("History Service Test", function ()
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
			$on: function () { },
			$watch: function () { }
		};
		//	mock $rootLocation	[AngularJS]
		rootLocation = {
			$path: function () { }
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

		enumServ = enumService();
		popup = popupService();		//	/scripts/popupHandler.js
		variable = variableService();
		colorPicker = colorPickerService();	//	/scripts/colorPickerHandler.js
		scriptManager = scriptManagerService(popup, variable);	//	/scripts/scriptManager.js
		fidget = fidgetService(enumServ, variable, colorPicker, scriptManager, sce, http, timeout);	//	/scripts/fidgetTemplates.js
		project = projectService(rootScope, enumServ, fidget, popup, rootLocation,
								scriptManager, variable, setTimeout);	//	/scripts/projectModel.js
		historyServ = historyService(project);	//	/scripts/historyHandler.js

	});



	//----------------------------------------------------------------------------------------------
	//	loadState(proj, callback)
	//----------------------------------------------------------------------------------------------

	it("Loads project state", function ()
	{

		//	PREPARE
		//		Default parameters
		testScreen = 1;
		myProj = {
			screens: testScreen.toString(),
			id: 2,
			name: 3,
			backgroundImage: 4,
			initScript: 5
		};
		myCallback = undefined;
		//		Mock setCurrentScreenIndex function
		project.currentScreenIndex = 6;
		calledCurrentScreenIndex = 0;
		project.setCurrentScreenIndex = function (value) {
			calledCurrentScreenIndex++;
			expect(value).toEqual(project.currentScreenIndex);
		};
		//		Mock setupFidgets function
		fidget.defineProperties = 7;
		fidgetServiceFunction = fidgetService;
		fidgetService = fidget;	//	It overwrites the default function!!!
		calledSetupFidgets = 0;
		project.setupFidgets = function (callback) {
			calledSetupFidgets++;
			expect(callback).toEqual(fidget.defineProperties);
		};

		//	RUN
		historyServ.loadState(myProj, myCallback);

		//	VERIFY
		expect(project.screens).toEqual(testScreen);
		expect(project.id).toEqual(myProj.id);
		expect(project.name).toEqual(myProj.name);
		expect(project.backgroundImage).toEqual(myProj.backgroundImage);
		expect(project.initScript).toEqual(myProj.initScript);
		expect(calledCurrentScreenIndex).toEqual(1);
		expect(calledSetupFidgets).toEqual(1);

		//	RESET
		fidgetService = fidgetServiceFunction;

	});



	//----------------------------------------------------------------------------------------------
	//	clearHistory()
	//----------------------------------------------------------------------------------------------

	it("Clears history", function ()
	{

		//	PREPARE
		historyServ.currentHistoryIndex = 1;
		historyServ.history = [1, 2, 3, 4, 5];

		//	RUN
		historyServ.clearHistory();

		//	VERIFY
		expect(historyServ.currentHistoryIndex).toEqual(-1);
		expect(historyServ.history).toEqual([]);

	});



	//----------------------------------------------------------------------------------------------
	//	undo()
	//	redo()
	//	saveState()
	//----------------------------------------------------------------------------------------------

	describe("Restores previous or next state, saves state", function ()
	{

		//------------------------------------------------------------------------------------------
		//	PREPARE
		//

		beforeEach(function ()
		{

			//	Default parameters
			testIndex = 2;
			historyServ.currentHistoryIndex = testIndex;
			historyServ.history = [1, 2, 3, 4, 5];
			//	Mock loadState function
			calledLoadState = 0;
			historyServ.loadState = function (proj, callback) {
				calledLoadState++;
				expect(proj).toEqual(historyServ.history[historyServ.currentHistoryIndex]);
				expect(callback).toEqual(undefined);
			};

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	undo()
		//

		it("Restores previous state", function ()
		{

			//	RUN
			historyServ.undo();

			//	VERIFY
			expect(historyServ.currentHistoryIndex).toEqual(testIndex - 1);
			expect(calledLoadState).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	redo()
		//

		it("Restores next state", function ()
		{

			//	RUN
			historyServ.redo();

			//	VERIFY
			expect(historyServ.currentHistoryIndex).toEqual(testIndex + 1);
			expect(calledLoadState).toEqual(1);

		});



		//------------------------------------------------------------------------------------------
		//	TEST:	saveState()
		//

		it("Saves current project state to history", function ()
		{

			//	RUN
			historyServ.saveState();

			//	VERIFY
			expect(historyServ.history[historyServ.history.length - 1]).toEqual({
				screens: '[]',
				currentScreenIndex: project.currentScreenIndex,
				backgroundImage: project.backgroundImage,
				id: project.id,
				name: project.name,
				initScript: project.initScript
			});
			expect(historyServ.history.length).toEqual(testIndex + 2);	//	length + new state

		});

	});

});



/*
Laci's tests (all dorp errors, because project changed since these tests were made

    it("undo and modify", function () {
		var fidgets = [0, 1, 2, 3, 4];
		project.currentScreen = {
			fidgets: fidgets
		};
		historyServ.saveState();

		project.currentScreen.fidgets.push(5);
		historyServ.saveState();

		project.currentScreen.fidgets.push(6);
		historyServ.saveState();

		//3 save = history has to contain 3 elements
		expect(historyServ.history.length).toEqual(3);
		historyServ.undo();
		historyServ.undo();

		//after two undo, the length of the history still 3, to be able to redo
		expect(historyServ.history.length).toEqual(3);
		project.currentScreen.fidgets.push(6);

		//we went back to historyIndex 0
		expect(historyServ.currentHistoryIndex).toEqual(0);
		historyServ.saveState();

		//after a modification in history index 1, we cut the rest of the history
		expect(historyServ.currentHistoryIndex).toEqual(1);
		expect(historyServ.history.length).toEqual(2);
	});

	it("undo/redo changes", function () {
		var fidgets = [0, 1, 2, 3, 4];
		project.currentScreen = {
			fidgets: fidgets
		};

		expect(project.currentScreen.fidgets.length).toEqual(5);
		historyServ.saveState();
		expect(historyServ.currentHistoryIndex).toEqual(0);

		project.currentScreen.fidgets.pop();
		historyServ.saveState();

		expect(historyServ.currentHistoryIndex).toEqual(1);
		expect(project.currentScreen.fidgets.length).toEqual(4);

		historyServ.undo();

		//check if history index reduced by one
		expect(historyServ.currentHistoryIndex).toEqual(0);
		//check if the last fidget is restored;
		expect(project.currentScreen.fidgets.length).toEqual(5);

		historyServ.redo();

		//check is history index inc by one
		expect(historyServ.currentHistoryIndex).toEqual(1);
		//check if the last fidget is removed again;
		expect(project.currentScreen.fidgets.length).toEqual(4);
	});

*/