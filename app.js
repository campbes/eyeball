
/**
 * Module dependencies.
 */

/*require('nodetime').profile({
    accountKey: '12ebb2588385344195a18a6b67657081112052e8',
    appName: 'Node.js Application'
});*/

var package = require('./package.json');

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var test = require('./routes/test');
var detail = require('./routes/detail');
var history = require('./routes/history');
var monitor = require('./routes/monitor');
var report = require('./routes/report');
var http = require('http');
var path = require('path');
var request = require('request');
socket = require('socket.io');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.post('/test', test);
app.get('/report',report.overview);
app.get('/report/time',report.time);
app.get('/report/yslow',report.yslow);
app.get('/report/dommonster',report.dommonster);
app.get('/report/validator',report.validator);
app.get('/detail', detail);
app.get('/history', history);
app.get('/monitor', monitor);

var partials = function(req,res) {
    res.render('partials/'+req.params[0]);
};

app.get('/partials/*',partials);

DB = require("mongojs").connect("mongodb://eyeball:eyeball@ds047958.mongolab.com:47958/eyeball", ["urls"])["urls"];
//DB = require("mongojs").connect("eyeball", ["urls"])["urls"];

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var exec = require('child_process').exec;
exec('java -cp lib/vnu.jar nu.validator.servlet.Main 8888',
    function(err,stdout,stderr) {
        if(err) {
            console.log("VNU server error: "+err);
        }
        if(stderr) {
            console.log("VNU server error: "+stderr);
        }
        console.log("VNU server started: "+stdout);
    }
);

var winston = require('winston');
winston.add(winston.transports.File,
    {
        filename : 'eyeball.log',
        maxsize : 10485760
    }
);

eyeball = {
    io : socket.listen(server),
    logger : winston,
    handleExceptions : true
};

app.locals = {
    env : app.settings.env,
    version : package.version
};