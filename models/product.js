var sql = require('mysql');
var connection = sql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hqdb'
});

exports.getProducts =  function(args, callback) {
	//query
	
	var query = 'SELECT p.barcode, p.name, p.category, p.manufacturer, i.stock, i.min_stock';
		query+=', i.selling_price, p.cost_price, p.status FROM ';
		query+= 'product p INNER JOIN inventory i on i.barcode = p.barcode;';
	//var searchParameter = args.query;
	var result = {};
	result['metadata'] = [];
	result['data']= [];
	result['metadata'].push({"name": "barcode", "label" : "Barcode", "datatype" : "string"});
	result['metadata'].push({"name": "name", "label" : "Name", "datatype" : "string"});
	result['metadata'].push({"name": "category", "label" : "Category", "datatype" : "string"});
	result['metadata'].push({"name": "manufacturer", "label" : "Manufacturer", "datatype" : "string"});
	result['metadata'].push({"name": "stock", "label" : "Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "min_stock", "label" : "Min. Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "selling_price", "label" : "Selling Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "cost_price", "label" : "Cost Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "status", "label": "Status", "datatype" : "string","editable" : "false"});
	result['metadata'].push({"name": "delete", "label": "Delete"});
	
	connection.query( query,  function(err, rows, fields) {
		//var idx = 0;
		for (var tuple in rows) {
			var current ={};
			current['id'] = rows[tuple].barcode;
			//idx++;
			current['values'] = rows[tuple];
			result['data'].push(current);
		}
		console.log(result);
		callback(err, result);
	});
};

