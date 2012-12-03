var request = require('request');
var config = require('../config/config');

var connection = config.connection;
var hq_host = config.hq_host,
	outletid = config.outletid;



exports.push = function (args, callback) {
	// body...
	/*
	{
		length_query : '',
		query : '',
		length : '',
		url : '',
		data : '',
	}

	*/
	var length_query = args.length_query,
		query = args.query,
		length = args.length,
		url = args.url,
		data = args.data;


	connection.query(length_query, function (err,rows,fields) {
		// body...
		if(!err) {
			var size = rows.length;
			
		} else {
			console.log("Error in length_query : " + err);
			callback(true,null);
		}
	});

};