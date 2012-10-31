
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

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.syncWithHQ = function(req, res) {
		//find errors in arguments if any
		//create http request to hq server
		/*
		(need to split 1 and 2?)
		1. sync inventory
			a. retrieve product list for outlet
			b. add products to list that arent there in both product AND inventory
			c. place stock requests for new items
		2. sync stock requests
			a. check status of past requests
			b. change ones that are necessary
		*/
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