/*require('nodetime').profile({
    accountKey: '12ebb2588385344195a18a6b67657081112052e8',
    appName: 'Node.js Application'
});*/

var pkg = require('./package.json');

var express = require('express');
var routes = require('./routes');
var test = require('./routes/test');
var detail = require('./routes/detail');
var history = require('./routes/history');
var monitor = require('./routes/monitor');
var report = require('./routes/report');
var config = require('./routes/config');
var http = require('http');
var path = require('path');
var request = require('request');
var socket = require('socket.io');
var reportCfg = require('./conf/report');

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
app.use(express.static(path.join(__dirname, 'webapp')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', routes.index);
app.post('/test', test);
app.get('/report',report.overview);
app.get('/detail', detail);
app.get('/history', history);
app.get('/monitor', monitor);
app.get('/config', config);


// new rest api
// results
app.get('/v*/results', require('./routes/results').results);
app.get('/v*/results/latest', require('./routes/results').latest);
// record history
app.get('/v*/results/*/history', require('./routes/historyNew'));
// record
app.get('/v*/results/*', require('./routes/record').get);
app.delete('/v*/results/*', require('./routes/record').delete);
// test
app.post('/v*/test', require('./routes/test'));


function setReportRoute(name) {
    app.get('/report/'+name,function(req,res) {
        report.standard(req,res,name);
    });
}

var i=0;

for(i=reportCfg.reports.length-1; i>=0; i--) {
    setReportRoute(reportCfg.reports[i]);
}

var partials = function(req,res) {
    res.render('partials/'+req.params[0]);
};

app.get('/partials/*',partials);

//var DB = require("mongojs").connect("mongodb://eyeball:eyeball@ds047958.mongolab.com:47958/eyeball", ["urls"]).urls;
var DB = require("mongojs").connect("eyeball", ["urls"]).urls;

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
    handleExceptions : true,
    DB : DB
};

app.locals = {
    env : app.settings.env,
    version : pkg.version,
    host : "http://localhost:3000"
};