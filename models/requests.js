var request = require('request');
var config = require('../config/config');

var connection = config.connection;
var hq_host = config.hq_host,
	outletid = config.outletid;

exports.viewRequests = function  (callback) {
	// body...

	var query = 'select * FROM batch_request;';
	var result = {};
	result['metadata'] = [];
	result['data']= [];

	result['metadata'].push({"name":"request_id","label":"Request ID", "datatype" : "integer","editable":"false"});
	result['metadata'].push({"name":"date","label":"Date of Request", "datatype" : "date","editable":"false"});
	result['metadata'].push({"name":"status","label":"Status", "datatype" : "string", "editable" : "true"});
	connection.query(query, function  (err, rows, fields) {
		// body...
		if(!err) {
			for( var i in rows) {
				var current ={};
				current['id'] = rows[i]['request_id'];
				current['values'] = rows[i];
				result['data'].push(current);
			}
			callback(err,rows);
		} else {
			console.log(err);
		}
	});
};
exports.addRequest =  function(args, callback) {
	//packet format
	/*
	{
		barcode : "",
		quantity : ""
	}
	*/
	//check if current date order tuple exists in the db
	var query = 'INSERT INTO batch_request(date,status) SELECT CURDATE(),\'ADDED\' FROM DUAL WHERE ' +
				'NOT EXISTS(SELECT * FROM batch_request WHERE date=CURDATE());';
		barcode = args.barcode,
		quantity = args.quantity;

	if (requestList !== null) {
		connection.query( query,  function(err, rows, fields) {
			if(!err) {
				var errorFlag = 0,
					query_2 = '';
				
				query_2 += "INSERT INTO request_details VALUES(CURDATE()," + barcode+"," + quantity+ ");";

				//execute multiple queries
				connection.query(query_2, function (err2, rows2, fields2) {
					if(!err2) {
						console.log("Request for "+ quantity+ " items of "+ barcode+ " added to the list");
					} else {
						errorFlag = 1;
						console.log(err2);
						callback(err2);
					}
					if (errorFlag === 0) {
						console.log("Request successfully added");
						callback(null,true);
					} else {
						console.log("Errors encountered while adding request details");
						callback(true,null);
					}
				});
			} else {
				console.log(err);
				callback(err);
			}
		});
	} else {

	}
};

exports.deleteRequest = function (args, callback) {
	/*
		{
			request_id : ""
		}
	*/
	var date = args.date;
	if(request_id !== null) {
		var query = 'UPDATE batch_request SET status =\'CANCELLED\' WHERE date='+date+';';
		connection.query( query, function (err, rows, fields) {
		// body...
			if(!err) {
				console.log("Request successfully cancelled");
				callback(null,true);
			} else {
				console.log(err);
				callback(true,null);
			}
		});
	} else {
		console.log("Invalid or absent parameters");
	}
	
};

exports.setAsReceived = function(args, callback) {
	/*
	{
		request_id : ""
	}
	*/
	var date = args.date,
		query = "UPDATE batch_request SET status=\'RECEIVED\' WHERE date=" + date + ";";

	connection.query(query, function (err, rows, fields) {
		// body...
		if(!err) {
			console.log("Request Status successfully updated");
		} else {
			console.log("Unable to able request status");
		}
		callback(err,rows);
	});
};

function updateReceivedRequests(callback) {
	var query = "SELECT DATE(date) as date, status FROM batch_request WHERE status=\'RECEIVED\';";
	console.log("Updating RECEIVED requests..");
	connection.query(query, function(err,rows, fields) {
		if(!err) {
			console.log("Posting Sync request to HQ...");
			request.post({url : hq_host+'/syncReceivedRequests',json :true, body: {'outletid' : outletid, 'receivedList' : rows}}, function(error,response,body){
				if(!error) {
					if(body.status == "COMPLETED") {
						console.log("Server sync successful");
						var query_update = "UPDATE batch_request SET status=\'COMPLETED\' WHERE status=\'RECEIVED\';";
						connection.query(query_update, function(err2,rows2,fields2) {
							if(!err2) {
								console.log("COMPLETED Requests Synced");
							} else {
								console.log("Error in updating outletdb requests");
							}
							//All done!
							callback(err2, rows2);
						});
					}
				} else {
					console.log("Unable to sync with HQ\nError : " + error);
					callback(error);
				}
			});
		} else {
			console.log("Errors in retrieving RECEIVED stock requests");
			callback(err);
		}
	});
}
exports.syncRequests = function (callback) {
	// body...
	/*
	involves syncing 3 major components:
	1. newly added requests from outletdb to hqdb
	2. processed requests from hqdb to outletdb
	*/

	//get all the newly added requests
	var query = "SELECT b.date as date, d.barcode as barcode, d.quantity as quantity " +
				"FROM batch_request b INNER JOIN request_details d ON b.date=d.date WHERE b.status = \'ADDED\';";

	connection.query(query, function(err, rows, fields) {
		if(!err) {
			console.log(rows.length);
			request.post({ url: hq_host+'/syncAddedRequests',json:true, body :{ 'outletid' : outletid, 'addedList' : rows}}, function(error,response,body) {
				if(!error) {
					if( body.status == "ADDED") {
						var query_update = "UPDATE batch_request SET status=\'SENT\' WHERE status=\'ADDED\';";
						connection.query(query_update, function(err,rows2,fields2) {
							if(!err) {
								console.log("New Requests Synced");
								//callback(null,true);
							} else {
								console.log("Error in updating outletdb requests");
								//callback(true,null);
							}
							//update RECEIVED requests
							updateReceivedRequests(callback);
						});
					}
				} else {
					console.log("Error in connecting to the server");
					callback(true,null);
				}
			});
		} else {
			console.log(err);
			//callback(true,null);
		}
		//updateReceivedRequests(callback);

	});
};


