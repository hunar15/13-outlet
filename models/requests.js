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
		requestList = args.requestList;

	if (requestList !== null) {
		console.log("Creating stock requests for required PRODUCTS...");
		connection.query( query,  function(err, rows, fields) {
			if(!err) {
				var errorFlag = 0,
					query_2 = '';
				for(var i in requestList) {
					var current = requestList[i];
					query_2 += "INSERT INTO request_details SELECT CURDATE()," + current['barcode']+"," + current['quantity']+ " "+
							" FROM DUAL WHERE NOT EXISTS(SELECT * FROM request_details WHERE date= CURDATE() AND barcode="+current['barcode']+");";
				}
				if(query_2 !== '') {
					//execute multiple queries
					connection.query(query_2, function (err2, rows2, fields2) {
						if(!err2) {
							console.log("Restock request for "+ requestList.length+ " items added");
							callback(null,true);
						} else {
							errorFlag = 1;
							console.log(err2);
							callback(true,null);
						}
						/*if (errorFlag === 0) {
							console.log("Request successfully added");
							
						} else {
							console.log("Errors encountered while adding request details");
							callback(true,null);
						}*/
					});
				} else {
					console.log("Nothing to RESTOCK");
					callback(null,true);
				}
				
			} else {
				console.log(err);
				callback(true,null);
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
	
	var query = "select d.barcode as barcode, d.quantity as quantity from batch_request r  " +
				" inner join request_details d on r.date =d.date AND r.status=\'DISPATCHED\';";

	connection.query(query, function (err, rows, fields) {
		// body...
		if(!err) {
			var query2 = '';
			if(rows.length !== 0) {
				for(var i in rows) {
					var current = rows[i];
					query2 += 'UPDATE inventory SET stock=stock+'+current['quantity']+' WHERE barcode='+current['barcode']+';';
				}

				connection.query(query2, function(err2,rows2,fields2) {
					if(!err2) {
						console.log("STOCK added to INVENTORY");
						//callback(null,true);
						var query3 = 'UPDATE batch_request SET status=\'RECEIVED\' WHERE status=\'DISPATCHED\';';

						connection.query(query3, function(err3,rows3,fields3) {
							if(!err3) {
								console.log("RESTOCK Request status changed to RECEIVED");
								callback(null,true);
							} else {
								console.log("ERROR : " + err3);
								callback(true,null);
							}
						});
					} else {
						console.log("ERROR : " + err2);
						callback(true,null);
					}
				});
			} else {
				console.log("No STOCK has been received");
				callback(null,true);
			}
			console.log("Request Status successfully updated");
		} else {
			console.log("Unable to able request status");
			callback(true,null);
		}
	});
};




