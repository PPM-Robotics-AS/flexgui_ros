errorService.$inject = ['$rootScope']

function errorService($rootScope) {

    var srv = {
        dump: function (args) {
            if ($rootScope.isMobile) {
                var fileName = "error-" + Date.now() + ".log";

                json = JSON.stringify(args)

                var fileObj;
                window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dir) {
                    dir.getFile(fileName, { create: true }, function (file) {
                        fileObj = file;
                        writeLog(json);
                    });
                });

                function writeLog(str) {
                    if (!fileObj) return;
                    fileObj.createWriter(function (fileWriter) {
                        fileWriter.write(str);
                    }, fail);

                    function fail() {
                        popupService.show("Log save failed");
                    }
                }
            }
        }
    }


    return srv
}