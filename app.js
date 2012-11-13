
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/syncRequests', routes.syncRequests);
app.get('/recomputeSellingPrice', routes.recomputeSellingPrice);

app.get('/syncWithHQ', routes.syncWithHQ);
app.get('/restockCheck',routes.restockCheck);
app.get('/syncRevenue', routes.syncRevenue);
app.post('/add/stock',routes.addStock);
app.post('/processTransaction', routes.processTransaction);
app.post('/stock/setAsReceived', routes.setAsReceived);
app.post('/getPrice', routes.getPrice);
app.post('/add/transaction', routes.addTransaction);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
