// Karma configuration
// Generated on Tue Oct 13 2015 15:54:12 GMT+0200 (Central Europe Daylight Time)

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '../../',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],


		// list of files / patterns to load in the browser
		files: [
			//Included
			//{ pattern: 'scripts/angular.min.js', watched: false },
			//{ pattern: 'scripts/3rdParty/angular-mocks.js', watched: false },
			//{ pattern: '../../scripts/3rdParty/*.js', watched: false },

			//'scripts/projectModel.js',
			//'scripts/flexGui.js',
			'scripts/3rdParty/angular.min.js',
			//'scripts/3rdParty/angular-mocks.js',
			'scripts/3rdParty/jquery.min.js',
			//'scripts/3rdParty/canvas_resize.js',
			//'scripts/3rdParty/html2canvas.js',
			//'scripts/3rdParty/ng-cordova.js',
			//'scripts/3rdParty/roslib.js',
			'scripts/3rdParty/less.min.js',

			//'scripts/3rdParty/jquery.min.js',
			//'scripts/3rdParty/jquery-ui.min.js',
			//'scripts/3rdParty/jquery.knob.js',
			//'scripts/3rdParty/canvas_resize.js',
			//'scripts/3rdParty/angular.min.js',
			//'scripts/3rdParty/angular-mocks.js',
			//'scripts/3rdParty/angular-sanitize.js',
			//'scripts/colorPickerHandler.js',
			//'scripts/3rdParty/bootstrap.min.js',
			//'scripts/3rdParty/angular-route.min.js',
			//'scripts/hammer.min.js',
			//'scripts/3rdParty/angular.hammer.js',
			'scripts/popupHandler.js',
			'scripts/settingsWindowHandler.js',
			'scripts/projectsWindowHandler.js',
			'scripts/imageWindowHandler.js',
			'scripts/helpMessages.js',
			'scripts/deviceModel.js',
			'scripts/scriptManager.js',
			'scripts/projectModel.js',
			'scripts/backgroundService.js',
			'scripts/colorPickerHandler.js',
			'scripts/fidgetTemplates.js',
			'scripts/controllers/propertiesWindowController.js',
			'scripts/controllers/flexGuiController.js',
			'scripts/historyHandler.js',
			'scripts/clipboardHandler.js',
			'scripts/editHandler.js',
			'scripts/enumService.js',
			'scripts/variableService.js',
			'scripts/localization/localization.js',
			'scripts/localization/localization.en.js',

			'addons/multiUser/userService.js',
			'addons/factoryDesigner/factoryDesigner.js',
			'addons/advancedScripting/advancedScripting.js',
			/*'scripts/controllers/fidgetController.js',
			//'scripts/remoteViewController.js',
			'scripts/angular-knob.js',
			'scripts/3rdParty/slider.js',
			'scripts/3rdParty/bootbox.min.js',
			'scripts/3rdParty/perfect-scrollbar.min.js',
			'scripts/3rdParty/perfect-scrollbar.with-mousewheel.min.js',
			'scripts/3rdParty/angular-perfect-scrollbar.js',
			'scripts/3rdParty/codemirror.js',
			'scripts/3rdParty/ui-codemirror.js',
			'scripts/3rdParty/javascript.js',
			"scripts/3rdParty/eventemitter2.js",
			"scripts/3rdParty/roslib.js",
			"scripts/3rdParty/ace/src/ace.js",
			"scripts/3rdParty/ace/ui-ace.js",
			"scripts/3rdParty/ng-stats.js",
			"scripts/3rdParty/perfect-scrollbar.min.js",
			"scripts/3rdParty/perfect-scrollbar.with-mousewheel.min.js",
			"scripts/3rdParty/angular-perfect-scrollbar.js",
			"scripts/3rdParty/hammer.min.js",
			"scripts/3rdParty/angular.hammer.js",
			"scripts/angular-knob.js",
			"scripts/3rdParty/bootstrap-slider.js",
			"scripts/3rdParty/slider.js",
			"scripts/3rdParty/ng-cordova.js",
			'app.js',*/

			//Additional files for testing
			'tests/unit/mock.js',

			//	Tests
			'tests/unit/*Test.js'

		],


		// list of files to exclude
		exclude: [
		],


		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
		},


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['dots'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_WARN,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['Chrome'],


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false
	})
}
