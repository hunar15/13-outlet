var sql = require('mysql');
var connection = sql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'outletdb'
});


exports.getDiscontinued = function (callback) {
	// body...
	var query = 'SELECT p.barcode, p.name, p.category, p.manufacturer, i.stock, i.min_stock' +
			', i.selling_price, p.cost_price, p.status FROM ' +
			' product p INNER JOIN inventory i on p.barcode = i.barcode WHERE p.status=\'DISCONTINUED\';';
	var result = {};
	result['metadata'] = [];
	result['data']= [];

	result['metadata'].push({"name": "p.barcode", "label" : "Barcode", "datatype" : "string"});
	result['metadata'].push({"name": "p.name", "label" : "Name", "datatype" : "string"});
	result['metadata'].push({"name": "p.category", "label" : "Category", "datatype" : "string"});
	result['metadata'].push({"name": "p.manufacturer", "label" : "Manufacturer", "datatype" : "string"});
	result['metadata'].push({"name": "i.stock", "label" : "Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "i.min_stock", "label" : "Min. Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "i.selling_price", "label" : "Selling Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "p.cost_price", "label" : "Cost Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "p.status", "label" : "Status", "datatype" : "string"});

	connection.query( query, function (err, rows, fields) {
		// body...
		if(!err) {
			for( var i in rows) {
				var current = {};
				current['id'] = rows[i]['p.barcode'];
				current['values'] = rows[i];
				result['data'].push(current);
			}
			callback(err,result);
		} else {
			console.log(err);
		}
	});
};
exports.getInventory =  function(callback) {
	//query
	var query = 'SELECT p.barcode, p.name,p.category, p.manufacturer, i.stock, i.min_stock' +
			', i.selling_price, p.cost_price, p.status FROM ' +
			' product p INNER JOIN inventory i on p.barcode = i.barcode;';

	var result = {};
	result['metadata'] = [];
	result['data']= [];

	result['metadata'].push({"name": "p.barcode", "label" : "Barcode", "datatype" : "string"});
	result['metadata'].push({"name": "p.name", "label" : "Name", "datatype" : "string"});
	result['metadata'].push({"name": "p.category", "label" : "Category", "datatype" : "string"});
	result['metadata'].push({"name": "p.manufacturer", "label" : "Manufacturer", "datatype" : "string"});
	result['metadata'].push({"name": "i.stock", "label" : "Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "i.min_stock", "label" : "Min. Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "i.selling_price", "label" : "Selling Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "p.cost_price", "label" : "Cost Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "p.status", "label" : "Status", "datatype" : "string"});
	connection.query( query,  function(err, rows, fields) {
		if(!err) {
			for( var i in rows) {
				var current = {};
				current['id'] = rows[i]['p.barcode'];
				current['values'] = rows[i];
				result['data'].push(current);
			}
			callback(err,result);
		} else {
			console.log(err);
		}
	});
};

exports.getPrice = function(args, callback) {
	/*

	{
		cashier : "",
		barcode : ""
	}
	*/
	var cashier = args.cashier,
		barcode = args.barcode,
		result ={};
	
	if(cashier!== null && barcode !== null) {
		var query = 'SELECT selling_price from inventory WHERE barcode=' + barcode + ';';
		connection.query(query, function(err, rows, fields) {
			if((err === null)) {
				console.log("Price of " + barcode + " successfully retrieved");
				result['cashier'] = cashier;
				result['barcode'] = barcode;
				result['price'] = rows[0]['selling_price'];
				console.log(result);
				callback(null,result);
			} else {
				console.log("Error in processing query : " + err);
				callback(true,null);
			}
		});
	} else {
		console.log("Invalid or missing parameters");
		callback(true,null);
	}
};




