var config = require('../config/config');

var connection = config.connection;

exports.addDisplayUnit = function (callback) {
	// body...
	var query = "INSERT INTO display VALUES();";

	connection.query(query, function (err,rows,fields) {
		// body...
		if(!err) {
			console.log("Display Unit with ID : " + rows.insertId + " added");
			callback(null,true);
		} else {
			console.log("ERROR : " +err);
			callback(true,null);
		}
	});
};

exports.deleteDisplayUnit = function (args,callback) {
	// body...

	var display_id = args.display_id;

	if(display_id !== null) {
		var query = "DELETE FROM display where display_id="+display_id+";";

		connection.query(query, function (err,rows,fields) {
			// body...
			if(!err) {
				console.log("Display Unit with ID : " + display_id + " deleted from database");
				callback(null,true);
			} else {
				console.log("ERROR : " +err);
				callback(true,null);
			}
		});
	} else {
		console.log("Invalid or absent parameters");
		callback(true,null);
	}
};

exports.getAllDisplayUnits = function (callback) {
	// body...

	var query = "SELECT * from display;";

	connection.query(query, function (err,rows,fields) {
		// body...
		if(!err) {
			callback(null,rows);
		} else {
			console.log("ERROR : " +err);
			callback(true,null);
		}
	});
};

exports.assignProductToDisplayUnit = function  (args,callback) {
	// body...

	var display_id = args.display_id,
		barcode = args.barcode;

	if(display_id!==null && barcode!==null) {
		var query = "SELECT barcode from product WHERE display_id="+display_id+";";

		connection.query(query, function (err,rows,fields) {
			// body...
			if(!err) {
				query ='';
				if(rows.length !== 0) {
					query = "UPDATE product set display_id=NULL where barcode="+rows[0].barcode+";";
				}
				query += "UPDATE product set display_id="+display_id+" where barcode="+barcode+";";

				connection.query(query, function (err2,rows2,fields2) {
					if(!err2) {
						callback(null,rows2);
					} else {
						console.log("ERROR : " +err2);
						callback(true,null);
					}
				});
			} else {
				console.log("ERROR : " +err);
				callback(true,null);
			}
		});
	} else {
		console.log("Invalid or absent parameters");
		callback(true,null);
	}
	
};