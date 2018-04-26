/**
  * Handle arguments
  **/
var processArguments = {
	"name": "",
	"type": "",
	"config": {}
};

if (process.argv[2]) {
	try {
		var data = JSON.parse(process.argv[2]);
		
		for (var i in processArguments) {
			if (data[i]) {
				processArguments[i] = data[i];
			}
		}
		
		for (var i in data) {
			if (!processArguments[i]) {
				console.log("undefined key: " + i);
			}
		}
		
	}
	catch (e) {
		throw "expected argument to be JSON";
	}
}

if (processArguments.name === "" || processArguments.config.lat === undefined || processArguments.config.lon === undefined) {
	throw "expected JSON to contain a name and config.ip";
	return false;
}

if (!processArguments.config.interval) {
	processArguments.config.interval = 1000;
}

/**
  * DEFAULT API FUNCTION
  **/
var homeUiApi = require("../../frontend/mainApi.js");
 

/**
  * LOGIC
  **/
  
var sunCalc = require('suncalc');

var activeHomeUiId = false;
function getActiveHomeUiId (cb) {
	if (activeHomeUiId === false) {
		homeUiApi.requestApi("device", "POST", {
			name: processArguments.name,
			type: "text"
		}, function (err, id) { 
			if (err || id === false) {
				throw "Error requesting the api";
			}
			
			activeHomeUiId = id;
			
			cb(activeHomeUiId);
		});
	}
	else {
		cb(activeHomeUiId);
	}
}


function setTimer (name, ival, lastTimer) {
	setTimeout(function () {
		getActiveHomeUiId(function (id) {
			homeUiApi.requestApi("deviceValue", "POST", {
				id: id,
				value: JSON.stringify(name)
			}, function () {
				console.log("New state", name);
			});
		});
		
		if (lastTimer) {
			setTimers();
		}
	}, ival);
}

function setTimers () {
	var curDate = new Date();
	var times = sunCalc.getTimes(new Date(), processArguments.config.lat, processArguments.config.lon);
	
	var biggestTimer = 0;
	var smallestTimer = false;
	for (var name in times) {
		var time = times[name].getTime();
		
		if (time > biggestTimer) {
			biggestTimer = time;
		}
		
		if (smallestTimer === false || time < smallestTimer) {
			smallestTimer = time;
		}
	}
	
	var curTime = curDate.getTime();
	for (var name in times) {
		var time = times[name].getTime();
		
		var ival = time - curTime;
		
		if (ival > 0) {
			setTimer(name, ival, time === biggestTimer);
		}
		
		if (smallestTimer === time) {
			setTimer(name, 0, false);
		}
	}
	
}

setTimers();