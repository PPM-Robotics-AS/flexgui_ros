backgroundService.$inject = ["$rootScope", "colorPickerService"];

function backgroundService($rootScope, colorPickerService) {

    var srv = {
        backgroundTypes: {
            Color: { name: localization.currentLocal.fidgets.properties["color"], key: "Color", editor: 'views/properties/colorBackground.html' },
        },
        changeBacktroundType: function (screen) {
            editorService.editedFidget.backgroundImage = colorPickerService.generateBase64Color(screen.backgroundColor);
        }
    };
    
    $rootScope.background = srv;

    return srv;

}