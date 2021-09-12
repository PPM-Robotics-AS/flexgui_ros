historyService.$inject = ['projectService'];

function historyService(projectService) {

    var historyHandler = {
        //history
        history: [],

        //state index in the saved history
        currentHistoryIndex: -1,

        //load project state
        loadState: function (proj, callback) {
            if (!proj) return;

            var forceScreenBelt = projectService.forceScreenBelt;
            projectService.load(proj);
            projectService.forceScreenBelt = forceScreenBelt;
        },

        clearHistory: function(){
            historyHandler.currentHistoryIndex = -1;
            historyHandler.history = [];
        },

        //restore prev state
        undo: function () {
            historyHandler.currentHistoryIndex--;
            historyHandler.loadState(projectService.parseJSON(historyHandler.history[historyHandler.currentHistoryIndex]));
        },

        //restore next state
        redo: function () {
            historyHandler.currentHistoryIndex++;
            historyHandler.loadState(projectService.parseJSON(historyHandler.history[historyHandler.currentHistoryIndex]));
        },

        //save current project state to history
        saveState: function () {
            if (historyHandler.currentHistoryIndex < historyHandler.history.length) {
                historyHandler.history.splice(historyHandler.currentHistoryIndex + 1, historyHandler.history.length - historyHandler.currentHistoryIndex + 1);
            }
            var seen = [];
            historyHandler.history.push(projectService.toJSON(null, false));
            historyHandler.currentHistoryIndex = historyHandler.history.length - 1;
        }
    }

    return historyHandler;
}