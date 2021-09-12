/*console.log("start");*/
//Creates a mock function, keeps track of the calls and params used
test = function () {
	console.log(1);
};

var getMock = function (subFunction) {
	var result = { params: [] }
	result.mock = function () {
		result.params.push(arguments);

		if (typeof (subFunction) != 'undefined')
			subFunction(arguments);
	}
	return result;
}
/*
//Get a Mock using a subFunction, that writes out parameters
//It will be able to run custom checks, if the returned params are not good enough after the calls.
var test = getMock(function (args) {
	console.log("subFunction", args[0], args[1], args[2]);
});

//Get a Mock using no subFunction
var test2 = getMock();

//Call the mock function 
//It will overwrite the tested functions, e.g.
//var downloadProjectMock = getMock();
//_deviceService.downloadProject = downloadProjectMock.mock;
test.mock(5, 6, 7);
test.mock(1, 2, 3);
test.mock();

test2.mock(1);
test2.mock();

//The length of the params is the call count
console.log("test call count:", test.params.length);
console.log("test call params:", JSON.stringify(test.params));

console.log("test2 call count:", test2.params.length);
console.log("test2 call params:", JSON.stringify(test2.params));

//Output:
//start
//test.js:17 subFunction 5 6 7
//test.js:17 subFunction 1 2 3
//test.js:17 subFunction undefined undefined undefined
//test.js:35 test call count: 3
//test.js:36 test call params: [{"0":5,"1":6,"2":7},{"0":1,"1":2,"2":3},{}]
//test.js:38 test2 call count: 2
//test.js:39 test2 call params: [{"0":1},{}]
*/