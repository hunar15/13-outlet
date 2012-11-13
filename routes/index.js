
/*
 * GET home page.
 */
var mysql      = require('mysql'),
	restock = require('../models/requests'),
	inventory = require('../models/inventory'),
	transaction = require('../models/transaction');
var config = require('../config/config'),
	connection = config.connection;
var request = require('request'),
	hq_host = config.hq_host,
	outletid = config.outletid;

exports.recomputeSellingPrice = function (req,res) {
	inventory.recomputeSellingPrice(function (err, result) {
		if(!err) {
			res.send({"STATUS" : "SUCCESS"});
		} else {
			res.send({"STATUS" : "ERROR"});
		}
	});
};

exports.addStock = function(req,res) {
	inventory.addStock(req.body, function(err, result) {
		if(!err) {
			res.send(result);
		} else {
			res.send(err);
		}
	});
};

exports.addTransaction = function (req,res) {
	transaction.addTransaction(req.body, function (err, result) {
		if(!err) {
			res.send(result);
		} else {
			res.send(err);
		}
	});
};

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.setAsReceived = function(req,res) {
	restock.setAsReceived(req.body,function(err, rows){
		if(!err) {
			res.send(rows);
		} else {
			res.send(err);
		}
	});
};

exports.syncRequests = function (req, res) {
	// body...
	restock.syncRequests(function (err, result) {
		res.send(result);
	});
};

function syncDeleted(res) {
	var get_deleted = {
				url : hq_host+'/getDiscontinued',
				json : true,
				body : { 'outletid' : outletid }
			};
	request.post( get_deleted, function (error, response, body2) {
		if(!error) {
			//console.log("Response message : " + body2);
			var discontinueList = body2.discontinueList,
				discontinue_query = '';
			for (var i in discontinueList) {
				var current = discontinueList[i];
				discontinue_query += "UPDATE product SET status=\'DISCONTINUED\' WHERE barcode=" + current.barcode+";";
				//callDiscontinueQuery(query,current);
			}
			if(discontinue_query !== '') {
				connection.query(discontinue_query, function(err,rows,fields) {
					if(!err) {
						console.log("DISCONTINUED products successfully synced");
						res.send({"status" : "SUCCESS"});
					} else {
						console.log("Error occured while syncing DISCONTINUED products");
						console.log("Error : " + err);
						res.send({"status" : "ERROR"});
					}
					return;
				});
			} else {
				console.log("No products to be DISCONTINUED");
				res.send({"status" : "SUCCESS"});
			}
		} else {
			res.send({"status" : "ERROR"});
		}
	});
}

function callDiscontinueQuery(query,current) {
	connection.query(query, function(err, rows,fields) {
		if(!err)
			console.log(current.barcode + "discontinued.");
	});
}

exports.syncWithHQ = function(req, res) {
		//find errors in arguments if any
		//create http request to hq server
		/*
		(need to split 1 and 2?)
		1. sync inventory
			a. retrieve added product list for outlet
			b. add products to list that arent there in both product AND inventory
			c. place stock requests for new items
		2. sync stock requests
			a. check status of past requests
			b. change ones that are necessary
		*/
		var get_added = {
								url : hq_host+'/getAdded',
								json : true,
								body : { 'outletid' : outletid }
							};
		if ( outletid !== null ) {
			console.log('Connecting to HQ Server..');
			request.post( get_added, function (error, response, body) {
				if(!error) {
					console.log("Connected successfully!");
					var addedList = body.addedList;
					console.log("No. of new products : " + addedList.length);
					var i, flag;
					var product_query= '',
						inventory_query = '';
					for (i=0; i< addedList.length;i++) {
						var current = addedList[i];
						product_query += "INSERT INTO product select "+current['barcode']+",\'"+current['name']+"\',"+current['cost_price']+",\'"+current['category']+"\',\'"+current['manufacturer']+"\',\'NORMAL\'" +
										" FROM DUAL WHERE NOT EXISTS(select * from product where barcode="+current['barcode']+");";
						/*if(i==(addedList.length - 1 ))
							flag = 1;

						callQuery(flag,query,current, outletid);*/
						inventory_query += "INSERT INTO inventory select "+current['barcode']+",0,"+current['selling_price']+","+current['min_stock']+
										" FROM DUAL WHERE NOT EXISTS(select * from inventory where barcode="+current['barcode']+");";

					}
					if(product_query !== '') {
						connection.query(product_query, function(err,rows,fields) {
							if(!err) {
									console.log(rows);
								connection.query(inventory_query, function(err2,rows2,fields2) {

									if(!err2) {
										console.log("NEW items successfully synced with HQ");
									} else {
										console.log("Error while adding to the INVENTORY table");
									}
								});
							} else {
								console.log("Error while adding to the PRODUCT table");
								//console.log("Error : " +err);
							}
						});
					} else {
						console.log("No NEW products to be synced");
					}
					
					//now sync all products to be deleted
					syncDeleted(res);
				}
			} );
		} else {
			console.log("Invalid or absent parameters.");
		}
};

exports.syncRevenue = function (req, res) {
	// find errors in arguments if any
	var result = {};
	if (outletid !== null) {
		var query = 'SELECT distinct date, SUM(price * total) as revenue FROM sold_yesterday;';

		connection.query(query, function ( err, rows, fields ) {
			if(!err) {
				result['date'] = rows[0]['date'];
				result['revenue'] = rows[0]['revenue'];

				var query_2 = 'SELECT barcode, MAX(price * total) as revenue FROM sold_yesterday GROUP BY barcode;';

				connection.query(query_2, function(err2,rows2,fields2) {
					if(!err2) {
						result['barcode'] = rows2[0]['barcode'];
						result['outlet_id'] = outletid;

						console.log("Revenue details successfully retrieved");
						var post_options = {
								url : hq_host+'/syncRevenue',
								json : true,
								body : result
							};

						console.log("Syncing revenue with HQ...");

						//post sync request to HQ
						request.post(post_options, function(error, response, body) {
							if(!error) {
								if(body['STATUS'] === "SUCCESS") {
									console.log("Revenue successfully synced with HQ");
									res.send({"STATUS" : "SUCCESS"});
								} else {
									console.log(body['STATUS']);
									res.send({"STATUS" : "ERROR"});
								}
							} else {
								console.log("Error encountered");
								console.log("ERROR : " + error);
								res.send({"STATUS" : "ERROR"});
							}
						});
					} else {
						console.log("Error encountered");
						console.log("ERROR : " + err2);
						res.send({"STATUS" : "ERROR"});
					}
				});
			} else {
				console.log("Error encountered");
				console.log("ERROR : " + err);
				res.send({"STATUS" : "ERROR"});
			}
		});
	} else {
		console.log("Invalid or absent parameters");
		res.send({"STATUS" : "ERROR"});
	}
};

var t_errorFlag = 0;

exports.getPrice = function(req,res) {
	inventory.getPrice(req.body, function(err, result){
		if(err !== null) {
			res.send(err);
		} else {
			res.send(result);
		}
	});
};

function restockCheck (callback) {
	var restockCheckQuery = '';
	restockCheckQuery = "SELECT barcode, CEIL(min_stock * 2) as quantity FROM inventory where stock <= min_stock " +
						" AND NOT EXISTS( select * FROM batch_request b INNER JOIN request_details d" +
						" ON b.date=d.date AND d.barcode=barcode AND ( b.status=\'ADDED\' OR b.status=\'SENT\'));";
	connection.query(restockCheckQuery, function(err2,rows2,fields2) {
		if(!err2) {
			var result = {};
			result['requestList'] = rows2;
			restock.addRequest(result, function(err3, res3) {
				if(!err3) {
					//create restock requests
					console.log("RESTOCK REQUEST operation successfully completed");
					callback(null,true);
				} else {
					console.log("Error while add RESTOCK REQUESTS");
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

exports.restockCheck = function  (req,res) {
	restockCheck(function(err,result) {
		if(!err) {
			res.send({"STATUS" : "SUCCESS"});
		} else {
			console.log("Error encountered");
			console.log("Error : " + err);
			res.send({"STATUS" : "ERROR"});
		}
	});
};

exports.processTransaction = function (req, res) {
	// body...
	t_errorFlag =0;
	//first error check : do the required arguments exist
    console.log(req.body);
	var itemList = req.body.list,
		result = {};
	result['cashier'] = req.body.cashier;
	//result['list'] = itemList;
	var cashier = result['cashier'];
    
	if (itemList !== null) {
		/*
		{
			cashier : "",
			list : [{
				barcode : "",
				quantity : "",
				price : ""
			}]
		}
		*/
		var updateStockQuery ='';
            console.log(itemList);
		for (var i in itemList) {
			var current = itemList[i];
                    console.log(itemList[i]);
			updateStockQuery += "UPDATE inventory SET stock= stock -" +itemList[i]['quantity'] +" WHERE barcode=" + itemList[i]['barcode'] +" ;";
			//callTransactionQuery(query,current,cashier);
		}
		connection.query(updateStockQuery, function(err,rows,fields) {
			if(!err) {
				console.log("Bill processed without errors");
				result['errors'] = false;
				//carry out product stock request check
				restockCheck( function(err2, res2) {
					if(!err2) {
						res.send({ "STATUS" : "SUCCESS"});
					} else {
                                            console.log(err2);
						res.send({ "STATUS" : "FAIL"});
					}
				});
				
			} else {
				console.log("Bill processed with errors");
				res.send({"ERROR" : true});
                            console.log(err);
			}

			//add to transaction table
		});
		//res.send(result);
	} else {
		console.log("Absent parameters");
		res.send({error:true});
	}
};