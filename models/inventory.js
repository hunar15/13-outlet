var sql = require('mysql');
var connection = sql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'outletdb'
});

exports.getPrice = function( args, callback) {
	var barcode = args.barcode,
		query = "SELECT selling_price FROM inventory WHERE barcode=" + barcode +";";

	connection.query(query, function(err, rows, fields) {
		if(!err) {
			callback(err,rows);
		} else {
			console.log(err);
		}
	});
};

exports.getDiscontinued = function (callback) {
	// body...
	var query = 'SELECT p.barcode, p.name, p.manufacturer, i.stock, i.min_stock' +
			', i.selling_price, p.cost_price, p.status FROM ' +
			' product p INNER JOIN inventory i on p.barcode = i.barcode WHERE p.status=\'DISCONTINUED\';';
	var result={};
	connection.query( query, function (err, rows, fields) {
		// body...
		if(!err) {
			callback(err,rows);
		} else {
			console.log(err);
		}
	});
};
exports.getInventory =  function(callback) {
	//query
	var query = 'SELECT p.barcode, p.name, p.manufacturer, i.stock, i.min_stock' +
			', i.selling_price, p.cost_price, p.status FROM ' +
			' product p INNER JOIN inventory i on p.barcode = i.barcode;';

	connection.query( query,  function(err, rows, fields) {
		if(!err) {
			callback(err,rows);
		} else {
			console.log(err);
		}
	});
};




