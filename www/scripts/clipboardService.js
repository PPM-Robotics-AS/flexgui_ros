clipboardService.$inject = ['projectService', 'deviceService', 'fidgetService', 'projectStorageService'];

function clipboardService(projectService, deviceService, fidgetService, projectStorageService) {
    var clipboardHandler = {
        //fidgets on the clipboard
        clipboard: [],
        alma: false,
        //copy selected items
        copy: function (fidgets) {
            clipboardHandler.clipboard = [];
            clipboardHandler.alma = !clipboardHandler.alma;
            angular.copy(fidgets, clipboardHandler.clipboard);
        },

        //cut selected items
        cut: function (fidgets) {
            clipboardHandler.copy(fidgets);

            angular.forEach(fidgets, function (fidget) {
                projectService.deleteFidget(fidget.parent, fidget);
            });

            projectStorageService.save(true);
        },

        pasted: [],
        //paste items from clipboard
        paste: function (destinationContainer) {
            clipboardHandler.pasted = [];

            for (var i = 0; i < clipboardHandler.clipboard.length; i++) {
                var fidget = clipboardHandler.clipboard[i];
                clipboardHandler.pasted.push(
                    clipboardHandler.pasteChild(
                    fidget, destinationContainer,
                    fidget.properties._top,
                    fidget.properties._left));
            }

            projectStorageService.save(true);
        },

        pasteChild: function (fidget, parent, top, left) {
            var newFidget = fidgetService.getFidget(fidget.root, fidget.source, left, top, fidget.properties, fidget.icon, fidget.name, fidget.template, parent);
            angular.forEach(fidget.fidgets, function (f) {
                clipboardHandler.pasteChild(f, newFidget, f.properties._top, f.properties._left);
            });

            return newFidget;
        }
    }

    return clipboardHandler;
}