function popupService() {

    //Handles popupMessage related data and operations
    var popupHandler = {
        //List of messages to show. If empty, no message is shown.
        messages: [],
        //Minimize the messages
        minimized: false,
        //Gets the last message that is shown.
        last: function () {
            return popupHandler.messages[popupHandler.messages.length - 1];
        },
        //Enumeration of the 3 types of messages.
        types: {
            //Blue text marked with i sign
            info: { class: "glyphicon-info-sign", name: "info", color: "text-info" },
            //Yellow text marked with - in a circle sign
            warning: { class: "glyphicon-minus-sign", name: "warning", color: "text-warning" },
            //Red text marked with ! sign
            error: { class: "glyphicon-exclamation-sign", name: "error", color: "text-danger" }
        },
        //Adds a new message to the messages list. This will trigger the popupMessage to show up.
        //Without defining the type parameter the default info type will be used.
        show: function (text, type) {
            if (type == undefined)
                type = popupHandler.types.info;

            popupHandler.messages.push({ text: text, type: type });
        },
        //Removes the last message.
        close: function () {
            popupHandler.messages.pop();
        },
        //Removes all messages.
        closeAll: function () {
            popupHandler.messages = [];
        },
        //minimize the messages
        minimize: function () {
            popupHandler.minimized = true
        },
        get visible() {
            return  !popupHandler.minimized && popupHandler.messages.length > 0
        },
        showAll: function() {
            popupHandler.minimized = false
        }
    }

    return popupHandler;

}