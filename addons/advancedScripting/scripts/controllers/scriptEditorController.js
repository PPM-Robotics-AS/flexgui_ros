scriptEditorController.$inject = ['$scope', 'editorService', 'projectService', 'diagnosticsService', 'variableService', "$timeout"];

function scriptEditorController($scope, editorService, projectService, diagnosticsService, variableService, $timeout) {
    var currentProperty = null;
    $scope.aceLoaded = function (_e) {
        $scope.currentEditor = _e;
        $scope.id = "scriptEditor_" + variableService.guid();

        angular.forEach($(".ace_editor"), function (i) {
            if (!$(i).hasClass("ace-flexgui")) $(i).addClass("ace-flexgui");
        });

    }

    $scope.setCurrentProperty = function (p) {
        currentProperty = p;
    }

    $scope.fidgetPropertyEdited = function () {
        if ($scope.currentEditor.getSession().getDocument().getValue() != editorService.editedFidget.properties[currentProperty])
            editorService.editedFidget.properties[currentProperty] = $scope.currentEditor.getSession().getDocument().getValue();
    }

    $scope.diagScriptEdited = function () {
        if (diagnosticsService.editedTest.script != $scope.currentEditor.getSession().getDocument().getValue())
            diagnosticsService.editedTest.script = $scope.currentEditor.getSession().getDocument().getValue();
    }

    $scope.initEdited = function () {
        if (projectService.initScript != $scope.currentEditor.getSession().getDocument().getValue())
            projectService.initScript = $scope.currentEditor.getSession().getDocument().getValue();
    }

    $scope.styleEdited = function () {
        if (projectService.styleSheed != $scope.currentEditor.getSession().getDocument().getValue())
            projectService.styleSheed = $scope.currentEditor.getSession().getDocument().getValue();
    }

    $scope.editorStyle = {};
    $scope.isFullscreen = false;
    $scope.setFullscreen = function (isFull) {
        $scope.isFullscreen = isFull;

        if (isFull) {
            $scope.editorStyle.width = $(window).width();
            $scope.editorStyle.height = $(window).height();
            $timeout(function () {
                $scope.editorStyle.top = -$("#" + $scope.id).position().top;
                $scope.editorStyle.left = -$("#" + $scope.id).position().left;

                $timeout(function () { $scope.currentEditor.resize() }, 0);
            }, 0, true);
        } else {
            $scope.editorStyle = {};
            $timeout(function () { $scope.currentEditor.resize() }, 0);
        }

    }

    $(window).resize(function () {
        if ($scope.isFullscreen) {
            $scope.editorStyle.width = $(window).width();
            $scope.editorStyle.height = $(window).height();

            $timeout(function () {
                $scope.editorStyle.top = -$("#" + $scope.id).position().top;
                $scope.editorStyle.left = -$("#" + $scope.id).position().left;

                $timeout(function () { $scope.currentEditor.resize() }, 0);
            }, 0, true);

            $scope.currentEditor.resize();
        }
    });
}