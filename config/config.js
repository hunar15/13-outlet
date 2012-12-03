var sql = require('mysql');
var connection = sql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'outletdb',
  multipleStatements : true
});

function handleDisconnect(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    console.log('Re-connecting lost connection: ' + err.stack);

    connection = mysql.createConnection(connection.config);
    handleDisconnect(connection);
    connection.connect();
  });
}

handleDisconnect(connection);
//'http://localhost:3001',
var hq_host = 'http://localhost:3001',//'http://54.251.113.124',
	outletid = 1;

exports.sql = sql;
exports.connection = connection;
exports.hq_host = hq_host;
exports.outletid = outletid;

