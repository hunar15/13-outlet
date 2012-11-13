var sql = require('mysql');
var connection = sql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'outletdb',
  multipleStatements : true
});


var hq_host = 'http://localhost:3001',
	outletid = 1;

exports.sql = sql;
exports.connection = connection;
exports.hq_host = hq_host;
exports.outletid = outletid;

