var sql = require('mysql'),
	request = require('request'),
	connection = sql.createConnection({
		host     : 'localhost',
		user     : 'root',
		password : '',
		database : 'outletdb'
	});
var hq_host = 'http://localhost:3001',
	outletid = 2;
exports.viewRequests = function  (callback) {
	// body...

	var query = 'select * FROM batch_request;';
	connection.query(query, function  (err, rows, fields) {
		// body...
		if(!err) {
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
		requestList : [
			{
				barcode : "",
				quantity : ""
			}, ...
		]
	}
	*/
	var query = 'INSERT INTO batch_request(date,status) VALUES(NOW(),\'ADDING\');',
		requestList = args.requestList;

	if (requestList !== null) {
		connection.query( query,  function(err, rows, fields) {
			if(!err) {
				var errorFlag = 0,
					request_id = rows.insertId;
				console.log("Request no."+ rows.insertId+ " added in Batch");
				for(var i in requestList) {
					var current = requestList[i],
						query_2 = "INSERT INTO request_details VALUES("+request_id+
							"," + current['barcode']+"," + current['quantity']+ ");";

					connection.query(query_2, function (err2, rows2, fields2) {
						if(!err2) {

						} else {
							errorFlag = 1;
							console.log(err2);
							callback(err2);
						}
					});
				}
				if (errorFlag === 0) {
					console.log("Request successfully added");
					query = "UPDATE batch_request SET status=\'ADDED\' WHERE request_id="+request_id+";";
					connection.query(query, function(err3, rows3, fields3) {
						if(!err3) {
							console.log("Request successfully added");
							callback(err3,rows3);
						}
						else
							console.log("Final addition failed");
							callback(err3);
					});
				} else {
					console.log("Errors encountered while adding request details");
				}
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
	var request_id = args.request_id;
	if(request_id !== null) {
		var query = 'UPDATE batch_request SET status =\'CANCELLED\' WHERE request_id='+request_id+';';
		connection.query( query, function (err, rows, fields) {
		// body...
			if(!err) {
				console.log("Request successfully cancelled");
			} else {
				console.log(err);
			}
		});
	} else {
		console("Invalid or absent parameters");
	}
	
};

exports.setAsReceived = function(args, callback) {
	/*
	{
		request_id : ""
	}
	*/
	var request_id = args.request_id,
		query = "UPDATE batch_request SET status=\'RECEIVED\' WHERE request_id=" + request_id + ";";

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
	var query = "SELECT * FROM batch_request WHERE status=\'RECEIVED\';";

	connection.query(query, function(err,rows, fields) {
		if(!err) {
			request.post({url : hq_host+'/syncReceivedRequests',json :true, body: {'outletid' : 2, 'receivedList' : rows}}, function(error,response,body){
				if(!error) {
					if(body.status == "COMPLETED") {
						var query_update = "UPDATE batch_request SET status=\'COMPLETED\' WHERE status=\'RECEIVED\';";
						connection.query(query_update, function(err,rows2,fields2) {
							if(!err) {
								console.log("COMPLETED Requests Synced");
							} else {
								console.log("Error in updating outletdb requests");
							}
							//All done!
							callback(err, rows2);
						});
					}
				}
			});
		} else {
			console.log("Errors in retrieving RECEIVED stock requests");
		}
	});
}

exports.syncRequests = function (args, callback) {
	// body...
	/*
	involves syncing 3 major components:
	1. newly added requests from outletdb to hqdb
	2. processed requests from hqdb to outletdb
	*/

	//get all the newly added requests
	var query = "SELECT * FROM batch_request WHERE status=\'ADDED\';";

	connection.query(query, function(err, rows, fields) {
		if(!err) {
			console.log(rows.length);
			for( var i in rows) {
				var current = rows[i];
				var query2 = "SELECT * FROM request_details WHERE request_id="+current['request_id']+";";
				connection.query(query2, function(err, rows2, fields2) {
					request.post({ url: hq_host+'/syncAddedRequests',json:true, body :{ 'outletid' : outletid, 'addedList' : rows2}}, function(error,response,body) {
						if(!error) {
							if( body.status == "ADDED") {
								var query_update = "UPDATE batch_request SET status=\'SENT\' WHERE status=\'ADDED\';";
								connection.query(query_update, function(err,rows2,fields2) {
									if(!err) {
										console.log("New Requests Synced");
									} else {
										console.log("Error in updating outletdb requests");
									}
									//update RECEIVED requests
									if(i == (rows.length -1 )) {
										console.log("Syncing RECEIVED requests");
										updateReceivedRequests(callback);
									}
								});
							}
						} else {
							console.log("Error in connecting to the server");
						}
					});
				});
			}
			
		} else {
			console.log(err);
		}
	});
};


