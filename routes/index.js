
/*
 * GET home page.
 */
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'outletdb'
});
var http = require('request'),
	hq_host = 'http://localhost:3001';

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

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
								body : { 'outletid' : outletid }
							};
		if ( outletid !== null ) {
			request.post( get_added, function (error, response, body) {
				if(!error) {
					console.log("Response message : " + body);
					var addedList = body.addedList;
					for (var i in addedList) {
						var current = addedList[i];
						var query = "INSERT INTO product VALUES("+current.barcode+",\'"+current.name+"\',"+current.cost_price+",\'"+current.category+"\',\'"+current.manufacturer+"\',\'NORMAL\');";
						connection.query(query, function(err, rows,fields) {
							if(!err) {
								var sub_query = "INSERT INTO inventory VALUES("+current.barcode+",0,"+current.selling_price+","+current.min_stock+");";
								connection.query(sub_query, function(err,rows,fields) {
									if(!err) {
										console.log(current.barcode + "added.");
										//place stock request for this product over here
									}
									else
										console.log("Error adding " + current.barcode + " to Inventory");
								});
							} else {
								console.log("Error adding " + current.barcode + " to Product");
							}
						});
					}
					//now sync all products to be deleted
					var get_deleted = {
								url : hq_host+'/getDiscontinued',
								body : { 'outletid' : outletid }
							};
					request.post( get_deleted, function (error, response, body2) {
						if(!error) {
							console.log("Response message : " + body2);
							var discontinueList = body2.discontinueList;
							for (var i in addedList) {
								var current = addedList[i];
								var query = "UPDATE product SET status=\'DISCONTINUED\' WHERE barcode=" + current.barcode+";";
								connection.query(query, function(err, rows,fields) {
									if(!err)
										console.log(current.barcode + "discontinued.");
								});
							}
						}
					});
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

exports.processTransaction = function (req, res) {
	// body...

	//first error check : do the required arguments exist
	var itemList = req.body.values,
		errorFlag = 0,
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
			var query = "UPDATE inventory SET quantity= quantity -" +itemList[i]['quantity'];
			query += " WHERE barcode=" + itemList[i]['barcode'] +" ;";
			connection.query(query, function (err, rows) {
				if (err!== null) {
					errorFlag = 1;
					console.log( "Error in processing " + itemList[i]['barcode']);
				} else {
					console.log( itemList[i]['barcode'] + " deducted");
					var trans_query = "INSERT INTO transaction(cashier_id,unit_sold,date,barcode) VALUES"+
										"("+req.body.cashier+","+itemList[i]['quantity']+",NOW(),"+itemList[i]['barcode']+");";
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
		if (errorFlag == 1) {
			console.log("Bill processed with errors");
			result['errors'] = true;
		} else{
			console.log("Bill processed without errors");
			result['errors'] = false;
			//carry out product stock request check
		}
		res.send(result);
	} else {
		res.send('Absent parameters');
	}
};