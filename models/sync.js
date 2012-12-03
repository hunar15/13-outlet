var restock = require('../models/requests'),
	inventory = require('../models/inventory'),
	transaction = require('../models/transaction'),
	product = require('../models/product');
var config = require('../config/config'),
	connection = config.connection;
var request = require('request'),
	hq_host = config.hq_host,
	outletid = config.outletid,
    cronJob = require('cron').CronJob;

var pullTimeOutTries,
	endOfDayOptions,
	pullInventoryJob,
	pushInventoryJob,
	startOfDayOptions;




initSyncOptions();
startSyncOptions();

function startSyncOptions () {
	//console.log('WTF!!');
	if(pushInventoryJob !== undefined)
		pushInventoryJob.stop();
	startOfDayOptions = {
						cronTime : '30 6 * * *',

						onTick : startOfDaySync,
						start : false,
						timeZone :'Singapore'
					};
	pushInventoryJob = new cronJob(startOfDayOptions);
	pushInventoryJob.start();
	resetTimeOutTries();
}

function startOfDaySync () {
	// body...
	inventory.recomputeSellingPrice(function (err,result) {
		// body...
		if(!err) {
			pushInventoryDetailsToHQ();
		} else {
			console.log("Error occured while recomputing prices");
		}
	});

}
function initSyncOptions () {
	//console.log('WTF!!');
	if(pullInventoryJob !== undefined)
		pullInventoryJob.stop();
	endOfDayOptions = {
						cronTime : '30 23 * * *',

						onTick : endOfDaySync,
						start : false,
						timeZone :'Singapore'
					};
	pullInventoryJob = new cronJob(endOfDayOptions);
	pullInventoryJob.start();
	resetTimeOutTries();
}

function resetTimeOutTries() {
	pullTimeOutTries = 16;
}

function pushTransactions () {
	// body...
	console.log('Pushing TRANSACTIONS TO HQ..');
	var query = 'select d.id as id, d.barcode as barcode, d.quantity as quantity, d.price as price '+
			'from transaction t INNER JOIN transaction_details d on t.id=d.id where t.date=CURDATE() ;';

	connection.query(query, function (err,rows,fields) {
		// body...
		if(!err) {
			if(rows.length !== 0) {
				var sync_options = {
									url : hq_host+'/pushTransactions',
									json : true,
									body : { 'outletid' : outletid, 'transaction' : rows }
								};

				request.post(sync_options, function (error,response,body) {
					// body...
					if(!error) {
						if(body.status=='ADDED') {
							console.log("TRANSACTIONS successfully PUSHED");
							initSyncOptions();
							pushNewRequests();
						} else {
							console.log("Anomaly occured");
							retry(pushTransactions,2);
						}
					} else {
						console.log("ERROR : " + error);
						retry(pushTransactions,2);
					}
				});
			} else {
				console.log("No TRANSACTIONS to push");
				initSyncOptions();
				pushNewRequests();
			}
			
		} else {
			console.log("ERROR : " + err);
			retry(pushTransactions,2);
		}
	});
}

function pushInventoryDetailsToHQ(callback) {
	// body...
	var query = 'select barcode,stock,selling_price from inventory;';

	connection.query(query, function (err,rows,fields) {
		// body...
		if(!err) {
			var pushToHQ = {
				url : hq_host+'/pushInventoryToHQ',
				json : true,
				body : { 'outletid' : outletid, 'list' : rows }
			};

			request.post(pushToHQ, function(error,response,body) {
				if(!error) {
					if(body['STATUS'] === 'SUCCESS') {
						console.log('Inventory successfully PUSHED to HQ');
						//callback(null,{'STATUS' : 'SUCCESS'});
						//startSyncOptions();
					} else {
						console.log("Error occured on HQ");
						//callback(true,null);
					}
				} else {
					console.log("Error while pushing to HQ : "+error);
					//callback(true,null);
					retryStart(startSyncOptions);
				}
			});
		} else {
			console.log("Error occured while syncing DISCONTINUED products");
			console.log("Error : " + err);
			//callback(true,null);
		}
	});

}
function pullInventoryFromHQ() {
	console.log("Syncing INVENTORY with HQ...");

	var inventoryRetrievalOptions = {
							url : hq_host+'/syncAll',
							json : true,
							body : { 'outletid' : outletid }
						};

	request.post(inventoryRetrievalOptions, function(error,response,body) {
		if(!error) {
			var list = body.list,
				query = '';
				update_flag = 0,
				discontinue_flag = 0;
			if( list !== undefined ) {
				if( list.length !== 0) {
					for(var i in list) {
						var current = list[i];
						
						switch(current.status) {
							case "ADDED" :
								query += 'INSERT INTO product SELECT '+current.barcode+','+
									connection.escape(current.name)+','+current.cost_price+','+
									connection.escape(current.category)+','+current.manufacturer+',\'NORMAL\'' +
									' FROM DUAL WHERE NOT EXISTS(select * from product where barcode='+current.barcode+'); ';
								query += "INSERT INTO inventory select "+current.barcode+",0,"+current.selling_price+","+
									current.min_stock+" FROM DUAL WHERE NOT EXISTS(select * from inventory where barcode="+
									current.barcode+"); ";
								break;
							case "UPDATED" :
								update_flag = 1; //trigger to check if the the stock of has qualified or disqualified for restock
								query += 'UPDATE inventory SET min_stock='+current.min_stock+
								',selling_price='+current.selling_price+' WHERE barcode=' + current.product_barcode+' ;';
								break;
							case "DISCONTINUE":
								discontinue_flag = 1; //trigger to check if a product has been disqualified
								query += 'UPDATE product SET status=\'DISCONTINUED\' WHERE barcode=' + current.product_barcode+';';
								query += 'UPDATE inventory SET min_stock='+current.min_stock+
								',selling_price='+current.selling_price+' WHERE barcode=' + current.product_barcode+' ;';
								break;

							default:
								console.log("This should not have one happened");
								break;
						}
					}

					if( update_flag || discontinue_flag ) {
						query += 'DELETE d FROM batch_request b INNER JOIN request_details d on d.date=b.date'+
							' WHERE b.status=\'ADDED\' AND EXISTS( SELECT * FROM inventory i where i.stock > i.min_stock AND'+
							' i.barcode=d.barcode ) OR EXISTS( SELECT * FROM product p where p.status=\'DISCONTINUED\' AND '+
							'p.barcode =d.barcode );';
						//delete potentially empty request ids

						query += 'DELETE b FROM batch_request b WHERE NOT EXISTS( SELECT * FROM request_details d'+
							' WHERE d.date=b.date ) AND b.status=\'ADDED\';';
					}
					//call query

					connection.query(query,function (err,rows,fields) {
						// body...
						if(!err) {
							console.log('Retrieval of INVENTORY changes from HQ successful');
							restockCheck(function (err2,res) {
								// body...
								if(!err2) {
									//syncInventoryAck

									var inventoryAck = {
										url : hq_host+'/syncInventoryAck',
										json : true,
										body : { 'outletid' : outletid }
									};

									request.post(inventoryAck,function (error2,response2,body2) {
										// body...
										if(!error2) {
											//callback(null,body2);
											initSyncOptions();
											restockCheck(function (err3,res3) {
												// body...
												if(!err3) {
													pushTransactions();
												} else {
													console.log('Error :' + err3);
												}
											});
										} else {
											console.log('Error in sending ACK');
										}
									});
								} else {
									console.log("Error in computing restock");
									//callback(true,null);
								}
							});
						} else {
							console.log('ERROR in query : ' + err);
							//callback(true,null);
						}
					});
				} else {
					console.log('No change on HQ SIDE');
					//callback(null,{"STATUS" : "SUCCESS"});
					initSyncOptions();
					restockCheck(function (err3,res3) {
						// body...
						if(!err3) {
							pushTransactions();
						} else {
							console.log('Error :' + err3);
						}
					});
				}
			} else {
				console.log('Unable to process the list');
				//callback(true,null);
				retry(pullInventoryFromHQ,2);
			}
		} else {
			console.log(' ERROR occured : ' + error);
			//restockCheck(callback);
			retry(pullInventoryFromHQ,2);
		}
	});
}

function restockCheck (callback) {
	var restockCheckQuery = '';
	restockCheckQuery = "SELECT i.barcode as barcode, CEIL(i.min_stock * 2) as quantity FROM inventory i where i.stock <= i.min_stock " +
						" AND NOT EXISTS( select * FROM batch_request b INNER JOIN request_details d" +
						" ON b.date=d.date WHERE d.barcode=i.barcode AND ( b.status=\'ADDED\' OR b.status=\'SENT\')) " +
						" AND NOT EXISTS (select * from product p where p.barcode=i.barcode AND p.status =\'DISCONTINUED\');";
	connection.query(restockCheckQuery, function(err2,rows2,fields2) {
		if(!err2) {
			var result = {};
			result['requestList'] = rows2;
			restock.addRequest(result, function(err3, res3) {
				if(!err3) {
					//create restock requests
					console.log("RESTOCK REQUEST operation successfully completed");
					//syncRequests(callback);
					callback(null,true);
				} else {
					console.log("Error while adding RESTOCK REQUESTS");
					console.log("Error : " + err3);
					callback(true,null);
				}
			});
		} else {
			console.log("Error while calculating PRODUCTS which require restock");
			console.log("Error : " + err2);
			callback(true,null);
		}
	});
}

function pullDispatchedRequests() {
	console.log("Pulling DISPATCHED requests from HQ..");
	request.post( {url : hq_host+'/pullDispatchedRequests',json :true, body: {'outletid' : outletid}}, function(error,response,body) {
		if(!error) {
			if(body['STATUS'] === "SUCCESS") {
				var dp_list = body.dp_list;

				if(dp_list.length !== 0) {
					var query = '';
					for (var i in dp_list) {
						var current = dp_list[i],
							date = current['date'].split("T")[0];
						query += 'UPDATE batch_request SET status=\'DISPATCHED\' where date=\''+date+'\';';
					}

					connection.query(query, function (err,rows,fields) {
						if(!err) {
							console.log("DISPATCHED requests successfully updated");
							//callback(null,true);

							var remaining = 'SELECT * from batch_request where status=\'SENT\' ;';
							connection.query(remaining, function (err2,rows2,fields2) {
								// body...
								if(!err2) {
									if(rows2.length === 0) {
										initSyncOptions();
										console.log('All Restock Requests Approved!');
									} else {
										console.log('Approval of ' + rows2.length + ' restock requests pending');
										retry(pullDispatchedRequests,1);
									}
								}
							});
						} else {
							console.log("ERROR : " + err);
						}
					});
				} else {
					console.log("No requests approved from HQ side");
					retry(pullDispatchedRequests,1);
				}
			}
		} else {
			console.log("ERROR while posting request : " + error);
			retry(pullDispatchedRequests,2);
		}
	});
}

function pushNewRequests () {
	// body...
	/*
	involves syncing 3 major components:
	1. newly added requests from outletdb to hqdb
	2. processed requests from hqdb to outletdb
	*/

	//get all the newly added requests
	var query = "SELECT b.date as date, d.barcode as barcode, d.quantity as quantity " +
				"FROM batch_request b INNER JOIN request_details d ON b.date=d.date WHERE b.status = \'ADDED\';";

	console.log('Pushing NEW restock requests..');
	connection.query(query, function(err, rows, fields) {
		if(!err) {
			console.log("No. of NEW restock requests : " + rows.length);
			if(rows.length !== 0) {
				request.post({ url: hq_host+'/pushNewRequests',json:true, body :{ 'outletid' : outletid, 'addedList' : rows}}, function(error,response,body) {
					if(!error) {
						if( body.status == "ADDED") {
							var query_update = "UPDATE batch_request SET status=\'SENT\' WHERE status=\'ADDED\';";
							connection.query(query_update, function(err,rows2,fields2) {
								if(!err) {
									initSyncOptions();
									console.log("New Requests Pushed");
									//callback(null,true);

									//call NEXT FUNCTION
									pullDispatchedRequests();
								} else {
									console.log("Error in updating outletdb requests");
									//retry(pushNewRequests);
								}
								//update RECEIVED requests
								//updateReceivedRequests(callback);
							});
						} else {
							console.log("Anomaly occured");
							//retry(pushNewRequests);
							//updateReceivedRequests(callback);
						}
					} else {
						console.log("Error in connecting to the server");
						retry(pushNewRequests,2);
					}
				});
			} else {
				initSyncOptions();
				console.log('No NEW requests to be PUSHED');
				//callback(null,true);

				//call NEXT FUNCTION
				pullDispatchedRequests();
			}
		} else {
			console.log(err);
			retry(pushNewRequests,2);
		}
	});
}

function retry(func_name,stall) {
	// body...
	pullInventoryJob.stop();
	pullTimeOutTries--;
	if(pullTimeOutTries > 0) {
		endOfDayOptions.cronTime = '*/'+stall+' * * * *';
		endOfDayOptions.onTick = func_name;
		pullInventoryJob = new cronJob(endOfDayOptions);
		pullInventoryJob.start();
	} else {
		initSyncOptions();
		console.log("TIMEOUT TRIES REACHED. Further operations will be aborted.");
	}
}

function retryStart(func_name,stall) {
	// body...
	pushInventoryJob.stop();
	pullTimeOutTries--;
	if(pullTimeOutTries > 0) {
		startOfDayOptions.cronTime = '*/'+stall+' * * * *';
		startOfDayOptions.onTick = func_name;
		pushInventoryJob = new cronJob(startOfDayOptions);
		pushInventoryJob.start();
	} else {
		startSyncOptions();
		console.log("TIMEOUT TRIES REACHED. Further operations will be aborted.");
	}
}

function endOfDaySync() {
	console.log("PULLING INVENTORY FROM HQ");
	pullInventoryFromHQ();
}



exports.restockCheck = restockCheck;
exports.syncRequests = pushNewRequests;
