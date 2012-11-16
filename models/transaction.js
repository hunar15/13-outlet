var request = require('request');
var config = require('../config/config');

var connection = config.connection;
var hq_host = config.hq_host,
	outletid = config.outletid;



exports.addTransaction = function (args, callback) {
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
	var cashier = args.cashier,
		itemList = args.list;

	if(cashier !== null  && itemList !== null) {

		var query = "Select id from transaction where MONTH(date) = MONTH(CURDATE());";

		connection.query(query, function (err,rows,fields) {
			if(!err) {
				var query;
				if(rows.length === 0) {
					//insert new transaction with random id
					query = 'INSERT INTO transaction(id,cashier_id,date) VALUES(FLOOR( RAND() *1000000),\''+cashier+'\',CURDATE());';
				} else {
					//insert new transaction with appended id
					query = 'INSERT INTO transaction(cashier_id,date) VALUES(\''+cashier+'\',CURDATE());';
				}

				connection.query(query, function (err2,rows2,fields2) {
					if(!err2) {
						var query_2 = '';
						for(var i in itemList) {
							var current = itemList[i];
							query_2 += 'INSERT INTO transaction_details VALUES('+rows2.insertId+','+current.barcode+','+current.quantity+','+current.price+');';
						}
						connection.query(query_2, function(err3,rows3, fields3) {
							if(!err3) {
								console.log("Transaction details successfully logged");
								callback(null,true);
							} else {
								console.log("Error encountered while logging transaction details");
								console.log("Error : " + err3);
								callback(true,null);
							}
						});
					} else {
						console.log("Error encountered : " + err2);
						callback(true,null);
					}
				});
			} else {
				console.log("Error encountered : " + err);
				callback(true,null);
			}
			
			
		});
	} else {
		console.log("Invalid or absent parameters");
		callback(true,null);
	}
};

exports.viewTransactions = function (callback) {
	// body...
	var query = 'select t.id as id, t.cashier_id as cashier_id, DATE_FORMAT(t.date,\'%Y-%m-%d\') as date, '+
			' d.barcode as barcode, d.quantity as quantity, d.price as price'+
			' FROM transaction t inner join transaction_details d ON t.id=d.id ;';
	var result = {};
	result['metadata'] = [];
	result['data']= [];

	result['metadata'].push({"name":"id","label":"Transaction ID", "datatype" : "integer","editable":"false"});
	result['metadata'].push({"name":"cashier_id","label":"Cashier ID", "datatype" : "string", "editable" : "false"});
	result['metadata'].push({"name":"date","label":"Transaction Date", "datatype" : "date","editable":"false"});
	result['metadata'].push({"name":"barcode","label":"Barcode", "datatype" : "integer", "editable" : "false"});
	result['metadata'].push({"name":"quantity","label":"Quantity", "datatype" : "integer","editable":"false"});
	result['metadata'].push({"name":"price","label":"Price", "datatype" : "integer", "editable" : "false"});
	connection.query(query, function  (err, rows, fields) {
		// body...
		if(!err) {
			for( var i in rows) {
				var current ={};
				current['id'] = rows[i]['date'];
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