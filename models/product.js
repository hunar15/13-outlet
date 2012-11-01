var sql = require('mysql');
var connection = sql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'hqdb'
});

exports.getProducts =  function(args, callback) {
	//query
	/*
	{
		query : "none",
		sortby : "ASC/DESC",
		pageNumber
	}
	*/
	var query = 'SELECT barcode, name,s_name, category, manufacturer, stock, min_stock'
		query+=', selling_price, cost_price FROM '
		query+= 'product INNER JOIN inventory on barcode = product_barcode '
		query+=' INNER JOIN outlet ON id = outlet_id ';
	//var searchParameter = args.query;
	var result = {};
	result['metadata'] = [];
	result['data']= [];
	result['metadata'].push({"name": "barcode", "label" : "Barcode", "datatype" : "string"});
	result['metadata'].push({"name": "name", "label" : "Name", "datatype" : "string"});
	result['metadata'].push({"name": "s_name", "label" : "Name", "datatype" : "string"});
	result['metadata'].push({"name": "category", "label" : "Category", "datatype" : "string"});
	result['metadata'].push({"name": "manufacturer", "label" : "Manufacturer", "datatype" : "string"});
	result['metadata'].push({"name": "stock", "label" : "Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "min_stock", "label" : "Min. Stock", "datatype" : "integer"});
	result['metadata'].push({"name": "selling_price", "label" : "Selling Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "cost_price", "label" : "Cost Price", "datatype" : "double(2)"});
	result['metadata'].push({"name": "delete", "label": "Delete"});

	/*if(searchParameter != 'none') {
		query += ' WHERE s_name LIKE \'%' + searchParameter + '%\' OR name LIKE \'%' + searchParameter + '%\' ';
	}*/
	//query +=';';
	/*var pageNumber = args.pageNumber,
		sortBy = args.sortby,
		resultsPerPage = args.itemperpage,
		order = (args.asc === true) ? 'ASC' : 'DESC';
*/
	query += ';';
	//query +=		' ORDER BY name ' + order + ';';*/
	//console.log(query);
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

exports.addProduct = function (args, callback) {
	var name = args.name,
		category = args.category,
		barcode = args.barcode,
		cost_price = args.cost_price,
		manufacturer = args.manufacturer;
	var query = 'INSERT INTO product VALUES(\''+name+'\',\''+category+'\','+barcode+','+cost_price+',\''+manufacturer+'\');';
	console.log(query);
	connection.query( query, function (err, rows, fields) {
		console.log(err);
		callback(err, rows);
	});
};

exports.deleteProduct = function (args, callback) {
	var barcode = args.barcode;
	var query = 'UPDATE inventory SET status=\'DISCONTINUE\' WHERE barcode='+barcode+';';
	connection.query( query, function (err, rows, fields) {
		// body...
		console.log(err);
		callback(err, rows);
	});
};
exports.updateProduct = function (args, callback) {
	// body...
	var name = args.name,
		category = args.category,
		barcode = args.barcode,
		cost_price = args.cost_price,
		manufacturer = args.manufacturer;
	var query = 'UPDATE product SET name=\''+name+'\', category =\''+category+'\', cost_price='+cost_price+
				', manufacturer=\''+manufacturer+'\' WHERE barcode='+barcode+';';
	connection.query( query, function (err, rows, fields) {
		// body...
		callback(err, rows);
	});
};