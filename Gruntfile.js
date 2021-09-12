module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			build: {
			  options: {
				mangle:true,
			  },
			  files: {
				'build/<%= pkg.name %>.min.js': ['app.js', 'scripts/controllers/*.js', 'scripts/*.js'],
				'build/addons/mirrorMode/mirrorMode.js': ['addons/mirrorMode/mirrorMode.js'],
				'build/addons/factoryDesigner/factoryDesigner.js': ['addons/factoryDesigner/factoryDesigner.js'],
				'build/addons/easyEditMode/easyEditMode.js': ['addons/easyEditMode/easyEditMode.js'],
				'build/addons/multiUser/userService.js': ['addons/multiUser/userService.js'],
				'build/addons/advancedScripting/advancedScripting.js': ['addons/advancedScripting/advancedScripting.js'],
				'build/addons/advancedScripting/scripts/controllers/scriptEditorController.js': ['addons/advancedScripting/scripts/controllers/scriptEditorController.js'],
				'build/addons/extendedFidgets/extendedFidgets.js': ['addons/extendedFidgets/extendedFidgets.js'],
				'build/addons/extendedFidgets/scripts/controllers/cameraImageController.js': ['addons/extendedFidgets/scripts/controllers/cameraImageController.js'],
				'build/addons/extendedFidgets/scripts/controllers/shapeController.js': ['addons/extendedFidgets/scripts/controllers/shapeController.js'],
				'build/addons/extendedFidgets/scripts/controllers/slamMapController.js': ['addons/extendedFidgets/scripts/controllers/slamMapController.js'],
				'build/addons/imageBackground/imageBackground.js': ['addons/imageBackground/imageBackground.js'],
				'build/addons/nachiLink/nachiLinkService.js': ['addons/nachiLink/nachiLinkService.js'],
				'build/addons/templateWizard/wizardService.js': ['addons/templateWizard/wizardService.js'],
				'build/addons/themes/themesService.js': ['addons/themes/themesService.js'],
				'build/addons/shortcut/shortcutService.js': ['addons/shortcut/shortcutService.js'],
				'build/addons/timers/timerService.js': ['addons/timers/timerService.js'],
				'build/addons/remoteView/remoteViewService.js': ['addons/remoteView/remoteViewService.js'],
				'build/addons/palletizing/palletizingService.js': ['addons/palletizing/palletizingService.js'],
				'build/addons/welding/weldingService.js': ['addons/welding/weldingService.js'],
				'build/addons/fileStorage/fileStorageService.js': ['addons/fileStorage/fileStorageService.js'],
				'build/addons/remoteView/scripts/controllers/remoteViewController.js': ['addons/remoteView/scripts/controllers/remoteViewController.js']
			  }
			}
		},
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('default', ['uglify']);

};