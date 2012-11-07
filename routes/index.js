
/*
 * GET home page.
 */
var mysql      = require('mysql'),
	restock = require('../models/requests');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'outletdb'
});
var request = require('request'),
	hq_host = 'http://localhost:3001';

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

function syncDeleted( outletid) {
	var get_deleted = {
				url : hq_host+'/getDiscontinued',
				json : true,
				body : { 'outletid' : outletid }
			};
	request.post( get_deleted, function (error, response, body2) {
		if(!error) {
			console.log("Response message : " + body2);
			var discontinueList = body2.discontinueList;
			for (var i in discontinueList) {
				var current = discontinueList[i];
				var query = "UPDATE product SET status=\'DISCONTINUED\' WHERE barcode=" + current.barcode+";";
				callDiscontinueQuery(query,current);
			}
		}
	});
}

function callDiscontinueQuery(query,current) {
	connection.query(query, function(err, rows,fields) {
		if(!err)
			console.log(current.barcode + "discontinued.");
	});
}
function callQuery(flag, query , current, outletid) {
	connection.query(query, function(err, rows,fields) {
		if(!err) {
			console.log(current.barcode + " added to Product");
			var sub_query = "INSERT INTO inventory VALUES("+current.barcode+",0,"+current.selling_price+","+current.min_stock+");";
			connection.query(sub_query, function(err2,rows2,fields2) {
				if(!err2) {
					console.log(current.barcode + " added to Inventory");
					//place stock request for this product over here
				}
				else
					console.log("Error adding " + current.barcode + " to Inventory");
				if(flag) {
					syncDeleted(outletid);
				}
			});
		} else {
			console.log("Error adding " + current.barcode + " to Product");
		}
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
		var outletid = req.body.outletid;
		var get_added = {
								url : hq_host+'/getAdded',
								json : true,
								body : { 'outletid' : 1 }
							};
		if ( outletid !== null ) {
			console.log('IN here');
			request.post( get_added, function (error, response, body) {
				if(!error) {
					console.log("Response message : " + body);
					var addedList = body.addedList;
					console.log("Length : " + addedList.length);
					var i, flag;
					for (i=0; i< addedList.length;i++) {
						var current = addedList[i];
						console.log(current);
						var query = "INSERT INTO product VALUES("+current['barcode']+",\'"+current['name']+"\',"+current['cost_price']+",\'"+current['category']+"\',\'"+current['manufacturer']+"\',\'NORMAL\');";
						if(i==(addedList.length - 1 ))
							flag = 1;
						callQuery(flag,query,current, outletid);
					}
					//now sync all products to be deleted	
					syncDeleted(outletid);
				}
			} );
		} else {
			console.log("Invalid or absent parameters.");
		}
};

exports.syncRevenue = function (req, res) {
	// find errors in arguments if any
	var outletid = req.body.outletid;
	if (outletid !== null) {

	} else {

	}
};

var t_errorFlag = 0;
function callTransactionQuery(query, current) {
	connection.query(query, function (err, rows) {
		if (err) {
			t_errorFlag = 1;
			console.log( "Error in processing " + current['barcode']);
		} else {
			console.log( current['barcode'] + " deducted");
			var trans_query = "INSERT INTO transaction(cashier_id,unit_sold,date,barcode) VALUES"+
								"("+req.body.cashier+","+current['quantity']+",NOW(),"+current['barcode']+");";
			connection.query(trans_query, function(err,rows,fields) {
				if(!err) {
					console.log("Transaction logged");
				} else {
					console.log(err);
				}
			});
		}
	});
}

exports.processTransaction = function (req, res) {
	// body...
	t_errorFlag =0;
	//first error check : do the required arguments exist
	var itemList = req.body.values,
		result = {};
	result['cashier'] = req.body.cashier;
	if (itemList !== null) {
		/*
		{
			cashier : "",
			values : [{
				barcode : "",
				quantity : ""
			}]
		}
		*/
		for (var i in itemList) {
			var current = itemList[i];
			var query = "UPDATE inventory SET quantity= quantity -" +itemList[i]['quantity'];
			query += " WHERE barcode=" + itemList[i]['barcode'] +" ;";
			callTransactionQuery(query,current);
		}
		if (t_errorFlag == 1) {
			console.log("Bill processed with errors");
			result['errors'] = true;
		} else{
			console.log("Bill processed without errors");
			result['errors'] = false;
			//carry out product stock request check
		}
		res.send(result);
	} else {
		console.log("Absent parameters");
		res.send({error:true});
	}
};