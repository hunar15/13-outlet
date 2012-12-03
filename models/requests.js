var request = require('request');
var config = require('../config/config'),
	async =require('async');

var connection = config.connection;
var hq_host = config.hq_host,
	outletid = config.outletid;

exports.viewRequests = function  (callback) {
	// body...

	var query = 'select DATE_FORMAT(date,\'%Y-%m-%d\') as date, status FROM batch_request;';
	var result = {};
	result['metadata'] = [];
	result['data']= [];

	result['metadata'].push({"name":"date","label":"Date of Request", "datatype" : "date"});
	result['metadata'].push({"name":"status","label":"Status", "datatype" : "string"});
	result['metadata'].push({"name":"details","label":"View details"});
	connection.query(query, function  (err, rows, fields) {
		// body...
		if(!err) {
			for( var i in rows) {
				var current ={};
				current['id'] = i;
				current['values'] = rows[i];
				result['data'].push(current);
			}
			callback(null,result);
		} else {
			console.log(err);
			callback(true,null);
		}
	});
};

exports.viewRequestDetails = function  (args,callback) {
	// body...
	var date = args.date;

	if(date !== null) {
		var query = 'select barcode, quantity, received from request_details where date = \''+date+'\';',
			result ={};


		result['metadata'] = [];
		result['data']= [];

		result['metadata'].push({"name":"barcode","label":"Barcode", "datatype" : "string"});
		result['metadata'].push({"name":"quantity","label":"Quantity", "datatype" : "double(,0,dot,comma,1,n/a)"});
		result['metadata'].push({"name":"received","label":"Received"});
		//what metadata is required?
		connection.query(query, function (err,rows,fields) {
			// body...
			if(!err) {
				for(var i in rows) {
					var current = {};
					current['id'] = rows[i]['barcode'];
					current['values'] = rows[i];
					result['data'].push(current);
				}
				callback(null,result);
			} else {
				console.log("ERROR : " + err);
				callback(true,null);
			}
		});
	} else {
		console.log("Invalid or absent parameters");
		callback(true,null);
	}
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
				'NOT EXISTS(SELECT * FROM batch_request b WHERE b.date=CURDATE());';
		requestList = args.requestList;

	if (requestList.length !== 0) {
		console.log("Creating stock requests for required PRODUCTS...");
		connection.query( query,  function(err, rows, fields) {
			if(!err) {
				var query_2 = '',
					i =0;
				console.log("Request List length : "+ requestList.length);
				async.forEachSeries(requestList,function (item,async_callback) {
				// body...
					i++;
					query_2 +="INSERT INTO request_details SELECT CURDATE()," + item.barcode+"," + item.quantity+ ", 0"+
							" FROM DUAL WHERE NOT EXISTS(SELECT * FROM request_details WHERE date= CURDATE() AND barcode="+item.barcode+");";
					if((i%config.segment_size)===0 || i ==(requestList.length)) {
						connection.query(query_2, function (err2, rows2, fields2) {
							if(!err2) {
								query_2='';
								async_callback(null);
							} else {
								console.log(err2);
								async_callback(true);
							}
						});
					} else {
						async_callback(null);
					}
				}, function(err){
						// if any of the saves produced an error, err would equal that error
						if(err)
							callback(err,null);
						else
							callback(null,true);
					}
				);
			} else {
				console.log(err);
				callback(true,null);
			}
		});
	} else {
		console.log("Nothing to RESTOCK");
		callback(null,true);
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

exports.receivedAll = function (args, callback) {
	// body...
	var date = args.date;

	if(date !== undefined) {
		var query = "UPDATE inventory i inner join request_details r on r.barcode=i.barcode set i.stock=i.stock +" +
						" r.quantity where r.date=\'"+date+"\' AND r.received=0;";
			query +="UPDATE batch_request SET status=\'COMPLETED\' WHERE date=\'"+date+"\' ;";
			query += "UPDATE request_details SET received=1 WHERE date=\'"+date+"\';";

		request.post({url : hq_host+'/stock/receivedAll',json :true, body: {'outletid' : outletid, 'date' : date}}, function(error,response,body){
			if(!error) {
				if(body['STATUS'] == "COMPLETED") {
					console.log("Updating received stock on HQ..");
					connection.query(query, function(err,rows, fields) {
						if(!err) {
							console.log("Restock request for " + date + " successfully COMPLETED");
							callback(null,true);
							//check if all products in the batch have been received and update
						} else {
							console.log("Error encountered : " + err);
							callback(true,null);
						}
					});
				}
			} else {
				console.log("Unable to sync with HQ\nError : " + error);
				callback(true,null);
			}
		});
		
	} else {
		console.log("Invalid or absent parameters");
		callback(true,null);
	}
};
exports.setAsReceived = function(args, callback) {
	var date = args.date,
		barcode = args.barcode,
		quantity = args.quantity;

	if(quantity!== undefined && date!==undefined && barcode!==undefined) {
		var query = "UPDATE request_details SET received=1 WHERE date=\'"+date+"\' AND barcode="+barcode+" ;";
		query += "UPDATE batch_request SET status=\'INCOMPLETE\' WHERE date=\'"+date+"\' ;";
		query += "UPDATE inventory SET stock=stock+"+quantity+" WHERE barcode="+barcode+";";
		query += "UPDATE batch_request SET status=\'COMPLETED\' WHERE date=\'"+date+"\'"+
				" AND NOT EXISTS( SELECT * from request_details WHERE date=\'"+date+"\' AND received=0);";

		request.post({url : hq_host+'/stock/received',json :true, body: {'outletid' : outletid,
				'date' : date, 'barcode' : barcode}}, function(error,response,body){
			if(!error) {
				if(body['STATUS'] === "COMPLETED") {
					console.log("Updating received stock of "+ barcode +"on HQ..");
					connection.query(query, function(err,rows, fields) {
						if(!err) {
							console.log("Restock request for " + barcode + " updated on HQ");
							callback(null,true);
							//check if all products in the batch have been received and update
						} else {
							console.log("Error encountered : " + err);
							callback(true,null);
						}
					});
				}
			} else {
				console.log("Unable to update on HQ\nError : " + error);
				callback(true,null);
			}
		});
	} else {
		console.log("Invalid or absent parameters");
		callback(true,null);
	}
};

