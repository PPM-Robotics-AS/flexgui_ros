wizardService.$inject = ['scriptManagerService', '$rootScope', 'variableService', '$location', '$timeout', 'popupService', '$sce', 'deviceService', 'projectService', 'projectStorageService'];

function wizardService(scriptManagerService, $rootScope, variableService, $location, $timeout, popupService, $sce, deviceService, projectService, projectStorageService) {
    //global getter setter, this will call the right storage method
    projectStorageService.setVariable = function (name, value) {
        projectStorageService.modes[projectStorageService.mode].setVariable(name, value);
    };
    projectStorageService.getVariable = function (name, callback) {
        return projectStorageService.modes[projectStorageService.mode].getVariable(name, callback);
    };

    //rosparam getter setter
    projectStorageService.modes.rosparam.setVariable = function (name, value) {
        deviceService.callService("/rosapi/set_param", { name: name, value: JSON.stringify(value) }, function (result) {
        });
    };
    projectStorageService.modes.rosparam.getVariable = function (name, callback) {
        if (projectStorageService.mode == 'rosparam') {
            deviceService.callService("/rosapi/get_param", { name: name }, function (result) {
                var value = JSON.parse(result.value);
                if (callback) {
                    callback(value);
                }
            });

            setTimeout(function () {
                projectStorageService.modes.rosparam.getVariable(name, callback);
            }, 1000);
        }
    }
    //localStorage getter setter
    projectStorageService.modes.localStorage.setVariable = function (name, value) {
        localStorage.setItem("userVariable_" + name, value);
    };
    projectStorageService.modes.localStorage.getVariable = function (name, callback) {
        if (callback) {
            var value = localStorage.getItem("userVariable_" + name);
            callback(value);
        }
    };

    //return wizard object
    var w = {
        //wizard modal visibility
        isVisible: false,
        //available templates
        templates: {},
        //pointer to the templates run function
        run: {},
        //currently selected template
        currentTemplate: null,
        //there editor where we can insert the script
        currentEditor: null,
        //the current template has only valid params
        isValid: false,
        //local variables to handle connector nodes on FG side
        connectorVariableLocals: [],
        //stored function name and run parameters
        customFunctions: [],
        //set wizard window visible
        setVisible: function (v, e) {
            w.isVisible = v;
            w.currentEditor = e;
            w.currentTemplate = null;
            //	Set screen names for changeScreen template
            if (v) {
                w.changeScreenOptionsRefresh();
                w.connectorVariableNodes();
                w.listOfCustomFunctions();
            }
        },
        //insert a template to the current editor
        insertTemplate: function () {
            w.isValid = true;
            angular.forEach(w.currentTemplate.params, function (param) {
                if (!param.valid) w.isValid = false;
            });

            if (w.isValid) {
                w.currentEditor.session.insert(
					w.currentEditor.getCursorPosition(), w.currentTemplate.getScript());
                w.isVisible = false;
            }
        },
        //adds a template to the list
        addTemplate: function (n, p, a, h) {
            w.templates[n] = {
                params: p,
                action: a,
                help: localization.currentLocal.wizard.templates[n].help,
                label: localization.currentLocal.wizard.templates[n].title,
                name: n
            };

            //add to scriptManager to be able to replace and run
            scriptManagerService.addScriptReplace('#' + n, '$rootScope.wizard.run.' + n);

            //get the inserted script line
            w.templates[n].getScript = function () {
                var values = [];
                angular.forEach(w.currentTemplate.params, function (p) {
                    if ([null, "null", undefined, "undefined"].indexOf(p) > -1) {
                        values.push(null);
                    }

                    switch (p.type) {
                        case "number":
                            values.push(p.value);
                            break;
                        case "script":
                            values.push("function( " + p.paramsToPass + " ){\n" + p.value + "\n}");
                            break;
                        default:
                            values.push("'" + p.value + "'");
                    }
                });

                var wizard = "#" + w.currentTemplate.name + "( " + values.join(", ") + " );\n";

                return wizard;
            }

            w.run[n] = w.templates[n].action;
        },
        //check current template's validity
        checkValid: function () {
            w.isValid = true;

            angular.forEach(w.currentTemplate.params, function (param) {
                if (!param.valid) w.isValid = false;
            });

            return w.isValid;
        }
    };



    //----------------------------------------------------------------------------------------------
    //	TEMPLATES
    //
    //	Parameter types:	text	"<input>"
    //						number	 <input>
    //						dropdown (if the param has 'options' property with an array)
    //						script (if the param has 'paramsToPass' property with an array)
    //----------------------------------------------------------------------------------------------



    //----------------------------------------------------------------------------------------------
    //	Template for creating a topic
    //
    w.addTemplate("createTopic", [
			{
			    name: "name",
			    type: "text",
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false,
			},
			{
			    name: "type",
			    type: "text",
			    value: "std_msgs/String",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: true,
			},
			{
			    name: "subscribe",
			    type: "dropdown",
			    options: ["False", "True"],
			    value: "True",
			    onChange: function () { },
			    valid: true,
			},
			{
			    name: "friendlyName",
			    type: "text",
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false,
			},
			{
			    name: 'onChange',
			    value: "	/* This script will be copied to the topic's On Change parameter */\n	",
			    type: "script",
			    paramsToPass: [],
			    hidden: true,
			    onChange: function () { },
			    valid: true,
			}
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (n, t, s, f, oc) {
		    //	Create a new topic
		    var path = "/wizard/" + n;
		    var topic = new ROSLIB.Topic({
		        name: path,
		        messageType: t,
		        ros: variableService.ros
		    });

		    //	Setup ros
		    topic.ros = variableService.ros;

		    //	Advertise topic
		    topic.advertise();

		    //	Have to wait until ROS is updated and the topic is in device.nodes
		    var watchdog = 60000;	//	Wait maximum 1 min
		    var checkIfTopicIsThere = function () {

		        //	If time is out
		        if (watchdog < 0) {
		            //console.log("Couldn't subscribe to /wizard/" + n + " topic");
		        }
		            //	If can't find topic yet, wait
		        else if (deviceService.nodes['wizard'] == undefined ||
					deviceService.nodes['wizard'][n] == undefined) {
		            setTimeout(checkIfTopicIsThere, 1000);
		            watchdog -= 1000;
		        }
		            //	If finally found the topic
		        else {
		            //	Subscribe topic
		            deviceService.nodes['wizard'][n].subscribed =
						["True", "true", "on", 1].indexOf(s) > -1;
		            //	Set friendly name
		            deviceService.nodes['wizard'][n].friendlyName = f;

		            deviceService.updateFriendlyCache();

		            //	Prepare onClick script
		            var sc = "/*\n";
		            sc += "This script is generated by a wizard called 'createTopic'\n";
		            sc += "That function might overwrite any changes made here!\n";
		            sc += "*/\n";
		            sc += "\n";
		            sc += "var onChangeFunction = " + oc;
		            sc += "\n";
		            sc += "onChangeFunction();\n";
		            //	Set onClick script after initialization finished
		            $timeout(function () {
		                projectService.interfaceMetaData.setOnChangeScript(path, sc);
		            }, 100, true);

		            //console.log("Subscribed to /wizard/" + n + " topic");
		        }
		    };

		    checkIfTopicIsThere();

		}
	);



    //	Set dropdown parameters of changeScreen
    w.changeScreenOptionsRefresh = function () {
        w.templates["changeScreen"].params[0].options = [];
        w.templates["connectorVariable"].params[0].value = "";
        for (var i = 0; i < projectService.screens.length; i++) {
            w.templates["changeScreen"].params[0].options[i] =
				projectService.screens[i].properties.name;
        }
    };

    //----------------------------------------------------------------------------------------------
    //	Template to change screen
    //
    w.addTemplate("changeScreen", [
			{
			    name: "screen",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			}
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (screenName) {
		    //	Change screen to the selected one
		    var found = false;
		    for (var i = 0; i < projectService.screens.length; i++) {
		        if (projectService.screens[i].properties.name == screenName) {
		            $location.path(screenName);
		            found = true;
		            break;
		        }
		    }
		    if (!found) {
		        popupService.show(localization.currentLocal.wizard.templates["changeScreen"].error +
					screenName, popupService.types.error);
		    }

		}
	);



    //	Set 'node' dropdown parameters of connectorVariable and callService templates 
    w.connectorVariableNodes = function () {
        //	Clean previous parameters
        w.templates["connectorVariable"].params[0].options = [];
        w.templates["connectorVariable"].params[0].value = "";
        w.templates["getConnectorVariable"].params[0].options = [];
        w.templates["getConnectorVariable"].params[0].value = "";
        w.templates["setConnectorVariable"].params[0].options = [];
        w.templates["setConnectorVariable"].params[0].value = "";
        w.templates["getReadyConnectorVariable"].params[0].options = [];
        w.templates["getReadyConnectorVariable"].params[0].value = "";
        w.templates["callService"].params[0].options = [];
        w.templates["callService"].params[0].value = "";

        //	Get all nodes
        var i = 0, ii = 0;
        for (n in deviceService.nodes) {
            w.templates["callService"].params[0].options[i] = n;
            if (deviceService.nodes[n].Variables != undefined) {
                w.templates["connectorVariable"].params[0].options[ii] = n;
                w.templates["getConnectorVariable"].params[0].options[ii] = n;
                w.templates["setConnectorVariable"].params[0].options[ii] = n;
                w.templates["getReadyConnectorVariable"].params[0].options[ii] = n;
                ii++;
            }
            i++;
        }
    };

    //	Set 'variable' dropdown parameters of connectorVariable
    w.connectorVariableVariables = function (n) {
        //	Ask for variables
        deviceService.nodes[n].Variables.call({}, function (result) {
            //	Wait to finish onChange function
            $timeout(function () {
                //	Clean previous parameters
                w.currentTemplate.params[1].options = [];

                //	Get all variables
                for (var i = 0; i < result.variables.length; i++) {
                    w.currentTemplate.params[1].options.push(result.variables[i]);
                }

            }, 0, true);
        });
    };

    //----------------------------------------------------------------------------------------------
    //	Template to handle connector variable
    //
    w.addTemplate("connectorVariable", [
			{
			    name: "node",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else {
			            this.valid = true;
			            w.currentTemplate.params[1].value = "";
			            w.connectorVariableVariables(this.value);
			        }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "variable",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "friendlyName",
			    type: "text",
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (node, variable, friendlyName) {
		    //	Save full path
		    var path = "/" + node + "/Variables/" + variable;
		    //console.log(path);

		    //	Subscribe
		    var subscribeThisTopic = function () {
		        //	Have to wait until ROS is updated and the topic is in device.nodes
		        var watchdog = 60000;
		        var checkIfTopicIsThere = function () {
		            //	If time is out
		            if (watchdog < 0) {
		                //console.log("Couldn't subscribe to " + path + " topic");
		            }
		                //	If the topic is not there yet, wait
		            else if (deviceService.nodes[node] == undefined ||
						deviceService.nodes[node]["Variables/" + variable] == undefined) {
		                setTimeout(checkIfTopicIsThere, 1000);
		                watchdog -= 1000;
		            }
		                //	If the topic is there, continue
		            else {
		                //	Subscribe topic
		                deviceService.nodes[node]["Variables/" + variable].subscribed = true;
		                //	Set local variables
		                if (deviceService.nodes[node]["Variables/" + variable].value != null) {
		                    w.connectorVariableLocals[path] =
								deviceService.nodes[node]["Variables/" + variable].value.value;
		                }

		                //console.log("Subscribed to " + path + " topic");
		            }
		        };

		        checkIfTopicIsThere();
		    };

		    //	Node settings after subscription
		    var defineLocalVariables = function () {
		        //	Set friendly name
		        deviceService.nodes[node]["Variables/" + variable].friendlyName = friendlyName;
		        deviceService.updateFriendlyCache();

		        //	Set local variables in wizardService
		        var sc = "/*\n";
		        sc += "This script is generated by a wizard called 'connectorVariable'\n";
		        sc += "Do not change it!\n";
		        sc += "*/\n";
		        sc += "\n";
		        sc += "// WARNING! This script works only for String messages!\n";
		        sc += "#connectorVariableLocals['" + path + "'] = ";
		        //	WARNING! This script works only for String messages!
		        sc += "@" + friendlyName + ".value.value;\n";

		        projectService.changeScripts[path] = sc;

		        console.log(projectService.changeScripts);
		    }


		    //	If parameters are correct
		    if (deviceService.nodes[node] == undefined ||
				deviceService.nodes[node]["Variables/" + variable] == undefined ||
				deviceService.nodes[node]["Variables/" + variable].subscribed != true) {
		        //	Have to wait until ROS is updated and the node is in device.nodes
		        var watchdog = 60000;
		        var checkIfNodeIsThere = function () {
		            //	If time is out
		            if (watchdog < 0) {
		                //console.log("Couldn't subscribe to " + path + " topic");
		            }
		                //	If the node is not there yet, wait
		            else if (deviceService.nodes[node] == undefined ||
						deviceService.nodes[node].Variables == undefined) {
		                setTimeout(checkIfNodeIsThere, 1000);
		                watchdog -= 1000;
		                //console.log(deviceService.nodes[node]["Variables/" + variable], watchdog);
		            }
		                //	If the node is there, continue
		            else {
		                //	Call for variables
		                deviceService.nodes[node].Variables.call({}, function (result) {
		                    //	If can't find the topic
		                    if (result.variables.indexOf(variable) == -1) {
		                        //console.log("Couldn't subscribe to " + path + " topic");
		                    }
		                    else {
		                        //	Subscribe to topic
		                        deviceService.nodes[node].Subscribe.call(
									{ variable_name: variable }, function (result) {
									    subscribeThisTopic();
									    defineLocalVariables();
									});
		                    }
		                });
		            }

		        }

		        checkIfNodeIsThere();
		    }
		    else {
		        defineLocalVariables();
		    }

		}
	);



    //----------------------------------------------------------------------------------------------
    //	Template to get local data of a connector variable
    //
    w.addTemplate("getConnectorVariable", [
			{
			    name: "node",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else {
			            this.valid = true;
			            w.currentTemplate.params[1].value = "";
			            w.connectorVariableVariables(this.value);
			        }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "variable",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
    ],

		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (node, variable) {
		    //	Save full path
		    var path = "/" + node + "/Variables/" + variable;

		    return w.connectorVariableLocals[path];
		}
	);

    angular.forEach(Object.keys(localization.items), function (key) {
        localization.items[key].wizard.templates.getPredefinedVariable = {
            title: "Get predefined variable",
            help: "Use this wizard to get a predefined variable by its name",
            params: {
                name: "Name"
            }
        }

        localization.items[key].wizard.templates.setPredefinedVariable = {
            title: "Set predefined variable",
            help: "Use this wizard to set a predefined variable by its name",
            params: {
                name: "Name",
                value: "Value"
            }
        }

        localization.items[key].wizard.templates.defineVariable = {
            title: 'Define variable',
            help: 'Use this wizard to define custom variables in a global storage',
            params: {
                setterFunction: 'Setter for the value',
                getterFunction: 'Getter for the value',
                isPersistent: 'Persistent',
                defaultValue: 'Default value',
                name: 'Name'
            }
        };
    });

    w.addTemplate("getPredefinedVariable", [{
        //name of the variable
        name: "name",
        type: "text",
        otpions: [],
        value: "",
        onChange: function () {
            if (this.value == "") { this.valid = false; }
            else { this.valid = true; }
            w.checkValid();
        },
        valid: false
    }], function (name) { return variableService.userDefined[name]; });


    $rootScope.$watch(function () { return Object.keys(variableService.userDefined).length; }, function () {
        var keys = [];

        angular.forEach(Object.keys(variableService.userDefined), function (k) { if (k.indexOf("_") == 0) keys.push(k.substring(1)); });

        w.templates.getPredefinedVariable.params[0].options = keys;
        w.templates.setPredefinedVariable.params[0].options = keys;
    });

    w.addTemplate("setPredefinedVariable", [{
        //name of the variable
        name: "name",
        type: "text",
        otpions: [],
        value: "",
        onChange: function () {
            if (this.value == "") { this.valid = false; }
            else { this.valid = true; }
            w.checkValid();
        },
        valid: false
    }, {
        //name of the variable
        name: "value",
        type: "text",
        value: "",
        onChange: function () {
            if (this.value == "") { this.valid = false; }
            else { this.valid = true; }
            w.checkValid();
        },
        valid: false
    }], function (name, value) { variableService.userDefined[name] = value; });

    //----------------------------------------------------------------------------------------------
    //	Template to define a variable to variableService/userDefined
    //
    w.addTemplate("defineVariable", [
			{
			    //name of the variable
			    name: "name",
			    type: "text",
			    value: "",
			    onChange: function () {
			        //the name cant be a duplication and cant  be empty
			        if (this.value == "" || "_" + name in variableService.userDefined || !variableService.isFriendlyNameValid(this.value)) {
			            this.valid = false;
			        }
			        else {
			            this.valid = true;
			        }

			        //update validity
			        w.checkValid();

			        if (this.valid) {
			            //update the script props
			            w.currentTemplate.params[3].value = "   /* Add a script here how to get your variable. */\n	return variableService.userDefined['_" + this.value + "'];";
			            w.currentTemplate.params[4].value = "	/* Add a script here how to set your variable. */\n	variableService.userDefined['_" + this.value + "'] = newValue;";
			        }
			    },
			    valid: false
			},
			{
			    //default value of the variable
			    name: "defaultValue",
			    type: "text",
			    value: "",
			    onChange: function () {
			        this.valid = true;
			        w.checkValid();
			    },
			    valid: true
			},
			{
			    //is the variable persistant? if yes: save to localStorage / ros
			    name: "isPersistent",
			    type: "text",
			    value: true,
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: true
			},
			{
			    //describes how to get the variable
			    name: "getterFunction",
			    type: "script",
			    paramsToPass: [],
			    hidden: true,
			    isDefault: true,
			    value: "	/* Add a script here how to get your variable. */\n	return variableService.userDefined['_" + name + "'];",
			    onChange: function () {
			    },
			    valid: true
			},
			{
			    //describe how to set the variable
			    name: "setterFunction",
			    type: "script",
			    paramsToPass: ['newValue'],
			    hidden: true,
			    value: "	/* Add a script here how to set your variable. */\n	variableService.userDefined['_" + name + "'] = newValue;",
			    onChange: function () { },
			    valid: true
			}
    ],
		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (name, defaultValue, isPersistent, getterFunction, setterFunction) {
		    //add default value as a private member of the userDefined vars
		    variableService.userDefined["_" + name] = defaultValue;
		    isPersistent = Boolean(isPersistent);

		    //add getter and setter for the new memebr
		    Object.defineProperty(variableService.userDefined, name, {
		        enumerable: true,
		        configurable: true,
		        get: getterFunction,
		        set: function (newValue) {
		            if (setterFunction) setterFunction(newValue);

		            if (isPersistent) {
		                projectStorageService.setVariable(name, newValue);
		            }
		        }
		    });

		    //add to friendly cache
		    variableService.addFriendlyName(name, variableService.userDefined[name]);

		    //if is persistant, setup the value
		    if (isPersistent) {
		        projectStorageService.getVariable(name, function (v) {
		            if (v) {
		                variableService.userDefined[name] = v;
		            }
		        });
		    }
		}
	);

    //----------------------------------------------------------------------------------------------
    //	Template to set data of a connector variable
    //
    w.addTemplate("setConnectorVariable", [
			{
			    name: "node",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else {
			            this.valid = true;
			            w.currentTemplate.params[1].value = "";
			            w.connectorVariableVariables(this.value);
			        }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "variable",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "value",
			    type: "text",
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "operation",
			    type: "dropdown",
			    options: ["=", "+=", "*="],
			    value: "=",
			    onChange: function () { },
			    valid: true
			},
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (node, variable, value, operation) {
		    //	Save full path
		    var path = "/" + node + "/Variables/" + variable;

		    //	If local variable is updated and doesn't wait for ROS anymore
		    if (w.connectorVariableLocals[path] ==
				deviceService.nodes[node]["Variables/" + variable].value.value) {
		        //	Calculate operation
		        var old = w.connectorVariableLocals[path];
		        var v = 0;
		        if (isNaN(value) == false) v = Number(value);
		        var o = 0;
		        if (isNaN(w.connectorVariableLocals[path]) == false)
		            o = Number(w.connectorVariableLocals[path]);

		        switch (operation) {
		            case "+=":
		                o = (o + v);
		                break;
		            case "*=":
		                o = (o * v);
		                break;
		            default:
		                o = v;
		                break;
		        }
		        w.connectorVariableLocals[path] = o.toString();

		        //	Call change variable service
		        deviceService.nodes[node]["ChangeVariable"].call(
					{
					    name: variable,
					    value: o.toString(),
					},
					function (response) {
					    //	If it wasn't successfull
					    if (response.fail_reason != "")
					        w.connectorVariableLocals[path] = old;
					}
				);
		    }
		}
	);



    //----------------------------------------------------------------------------------------------
    //	Template to get a connector variable if it's ready to write
    //
    w.addTemplate("getReadyConnectorVariable", [
			{
			    name: "node",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else {
			            this.valid = true;
			            w.currentTemplate.params[1].value = "";
			            w.connectorVariableVariables(this.value);
			        }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "variable",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (node, variable) {
		    //	Save full path
		    var path = "/" + node + "/Variables/" + variable;

		    return w.connectorVariableLocals[path] ==
				deviceService.nodes[node]["Variables/" + variable].value.value;
		}
	);



    //----------------------------------------------------------------------------------------------
    //	Template to autoInit function
    //
    w.addTemplate("autoDefine", [
			{
			    name: "variable",
			    type: "text",
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "value",
			    type: "text",
			    value: "",
			    onChange: function () { },
			    valid: true
			}
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (variable, value) {
		    //	Call autoInit 
		    scriptManager.autoInit(variable, value);
		}
	);



    //----------------------------------------------------------------------------------------------
    //	Template to message function
    //
    w.addTemplate("popup", [
			{
			    name: "message",
			    type: "text",
			    value: "",
			    onChange: function () { },
			    valid: true
			},
			{
			    name: "type",
			    type: "dropdown",
			    options: ["info", "warning", "error"],
			    value: "info",
			    onChange: function () { },
			    valid: true
			}
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (message, type) {
		    //	Shows message
		    var t;
		    switch (type) {
		        case "warning":
		            t = popupService.types.warning;
		            break;
		        case "error":
		            t = popupService.types.error;
		            break;
		        default:
		            t = popupService.types.info;
		            break;
		    }
		    popupService.show(message, t);
		}
	);



    //----------------------------------------------------------------------------------------------
    //	Template to $timeout function
    //
    w.addTemplate("timeout", [
			{
			    name: "timeout",
			    type: "number",
			    value: "1000",
			    onChange: function () {
			        if (isNaN(this.value) || this.value == "" || this.value <= 0) { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: true
			},
			{
			    name: "fn",
			    type: "script",
			    paramsToPass: [],
			    hidden: true,
			    value: "	/* Add a script here that you want to delay */\n	",
			    onChange: function () { },
			    valid: true
			},
			{
			    name: "name",
			    type: "text",
			    paramsToPass: [],
			    hidden: false,
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			}
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (timeout, fn, name) {
		    if (name && w.timers[name]) {
		        $timeout.cancel(w.timers[name]);
		        delete w.timers[name];
		    }

		    if (name) {
		        //	Runs $timeout
		        w.timers[name] = $timeout(fn, timeout, true);
		    } else {
		        $timeout(fn, timeout, true);
		    }
		}
	);

    w.timers = {};

    //	Search for a function name and returns the index if found
    w.findCustomFunction = function (name) {
        var found = -1;
        for (var i = 0; i < w.customFunctions.length; i++) {
            if (w.customFunctions[i].name == name) {
                found = i;
                break;
            }
        }
        return found;
    };

    //----------------------------------------------------------------------------------------------
    //	Template to define a custom function
    //
    w.addTemplate("setFunction", [
			{
			    name: "name",
			    type: "text",
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "fn",
			    type: "script",
			    paramsToPass: [],
			    hidden: true,
			    value: "	/* Put script here to save it as function */\n	",
			    onChange: function () { },
			    valid: true
			}
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (name, fn) {
		    //	Search for function
		    var found = w.findCustomFunction(name);

		    var obj = {};
		    //	Overwrites if exists
		    if (found != -1) {
		        obj = w.customFunctions[found];
		    }
		    obj.name = name;
		    obj.fn = fn;
		    //	Adds a new if doesn't exist
		    if (found == -1) {
		        w.customFunctions.push(obj);
		    }
		}
	);

    //	Set 'name' dropdown parameters of callFunction
    w.listOfCustomFunctions = function () {
        w.templates["callFunction"].params[0].options = [];
        for (var i = 0; i < w.customFunctions.length; i++) {
            w.templates["callFunction"].params[0].options[i] =
				w.customFunctions[i].name;
        }
    };

    //----------------------------------------------------------------------------------------------
    //	Template to publish a topic
    //
    w.addTemplate("publishTopic", [
			{
			    name: "path",
			    type: "text",
			    value: "/myNodeName/myTopicName",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: true
			},
            {
                name: "value",
                type: "text",
                value: "{\"data\": \"myValue\"}",
                onChange: function () {
                    if (this.value == "") { this.valid = false; }
                    else { this.valid = true; }
                    w.checkValid();
                },
                valid: true
            },
            {
                name: "type",
                type: "text",
                value: "std_msgs/String",
                onChange: function () {
                    if (this.value == "") { this.valid = false; }
                    else { this.valid = true; }
                    w.checkValid();
                },
                valid: true,
            }
    ],

		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (path, value, type) {
		    //	Search for topic
		    var found = null;

		    angular.forEach(deviceService.topics, function (topic) {
		        if (topic.path == path && !topic.isOffline && topic.listener) found = topic;
		    });

		    if (!found) {
				//advertise topic and then publish if not existing
		        var topic = new ROSLIB.Topic({
		            name: path,
		            messageType: type,
		            ros: variableService.ros
		        });

		        //Setup ros
		        topic.ros = variableService.ros;

		        //	Advertise topic
		        topic.advertise();
				
				// update ros
				deviceService.updateRos();
				
		        //wait for the topic to be created
		        var topicCreatedWatcher = $rootScope.$watch(function () { return deviceService.rosUpdated; }, function () {
		            //search for the topic
		            var t = null;

		            //select topic only of not offline
		            angular.forEach(deviceService.topics, function (topic) {
		                if (topic.path == path && !topic.isOffline) t = topic;
		            });

		            //if topic is existing
		            if (t) {
		                //remove watcher
		                topicCreatedWatcher();
		                t.subscribed = true;
		                //publish value
		                t.listener.publish(JSON.parse(value));
		            }
		        });
		    }
		    else {
		        //publish value if topic existing
		        found.listener.publish(JSON.parse(value));
		    }
		}
	);

    //----------------------------------------------------------------------------------------------
    //	Template to call a custom function
    //
    w.addTemplate("callFunction", [
			{
			    name: "name",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
    ],

		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (name) {
		    //	Search for function
		    var found = w.findCustomFunction(name);

		    //	Show popup if couldn't find
		    if (found == -1) {
		        popupService.show(localization.currentLocal.wizard.templates["callFunction"].error +
					name, popupService.types.error);
		    }
		    else {
		        w.customFunctions[found].fn();
		    }
		}
	);



    //	Set 'service' dropdown parameters of callService
    w.connectorVariableFunctions = function (value) {
        var n = value;
        w.currentTemplate.params[1].options = [];

        for (k in deviceService.nodes[n]) {
            if (deviceService.nodes[n][k].isService)
                w.currentTemplate.params[1].options.push(deviceService.nodes[n][k].shortPath);
        }
    };

    //----------------------------------------------------------------------------------------------
    //	Template to get a connector variable if it's ready to write
    //
    w.addTemplate("callService", [
			{
			    name: "node",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else {
			            this.valid = true;
			            w.currentTemplate.params[1].value = "";
			            w.connectorVariableFunctions(this.value);
			        }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "service",
			    type: "dropdown",
			    options: [],
			    value: "",
			    onChange: function () {
			        if (this.value == "") { this.valid = false; }
			        else { this.valid = true; }
			        w.checkValid();
			    },
			    valid: false
			},
			{
			    name: "parameter",
			    type: "number",
			    hidden: true,
			    value: "{/* Put parameters here */}",
			    onChange: function () { },
			    valid: true
			}
			,
			{
			    name: "callback",
			    type: "script",
			    paramsToPass: ["result"],
			    hidden: true,
			    value: "	/* The service will call back the following script: */\n	#popup( result, \"info\" );",
			    onChange: function () { },
			    valid: true
			}
    ],



		//------------------------------------------------------------------------------------------
		//	FUNCTION
		//
		function (node, service, parameter, callback) {
		    //	Save full path
		    var path = "/" + node + "/" + service;

		    //	Have to wait until ROS is updated and the service is in device.nodes
		    var watchdog = 60000;
		    var checkIfServiceIsThere = function () {
		        //	If time is out
		        if (watchdog < 0) {
		            //console.log("Couldn't call /" + node + "/" + service + " service");
		        }
		            //	If the service is not there yet, wait
		        else if (deviceService.nodes[node] == undefined ||
					deviceService.nodes[node][service] == undefined) {
		            setTimeout(checkIfServiceIsThere, 1000);
		            watchdog -= 1000;
		        }
		            //	If the service is there, continue
		        else {
		            //	Call service
		            deviceService.nodes[node][service].call(parameter, callback);
		        }
		    };

		    checkIfServiceIsThere();
		}
	);



    $rootScope.addModal("wizardsWindow", $sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/templateWizard/views/wizardsWindow.html"), "$rootScope.wizard.isVisible");

    if (!$rootScope.scriptEditorExtras) {
        $rootScope.scriptEditorExtras = [];
    }

    $rootScope.scriptEditorExtras.push($sce.trustAsResourceUrl($rootScope.addonServerUrl + "addons/templateWizard/views/properties/wizardTemplateButton.html"));

    

    return w;
}