//var util = require('util');
var SerialPort = require("serialport").SerialPort;
var serialLib = require("serialport");
var serialPort = new SerialPort("/dev/ttyUSB0", {
    baudrate: 9600,
    databits: 8,
    parity: 'none',
    stopbits: 1,
    parser:serialLib.parsers.readline("\n") 
});
var logInput = function () {
    serialPort.on("data", function (data) {
	console.log("start");
	console.log(data.toString());
    });
    serialPort.on("close", function (data) {
	console.log("end");
    });
};

logInput();
