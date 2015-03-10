/*require('nodetime').profile({
    accountKey: '12ebb2588385344195a18a6b67657081112052e8',
    appName: 'Node.js Application'
});*/
var HOSTNAME = process.env.HOSTNAME || "localhost";
var PORT = process.env.PORT || 3000;
var PROXYPORT = process.env.PROXYPORT || 3001;

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
app.set('port', PORT);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.compress());
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
//config
app.get('/v*/config',require('./routes/config'));
// monitor
app.get('/v*/monitor', require('./routes/monitor'));


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
DB.ensureIndex({timestamp:1});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var exec = require('child_process').exec;
var vnu = exec('java -Xss512k -cp lib/vnu.jar nu.validator.servlet.Main 8888',
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
    DB : DB,
    HOSTNAME : HOSTNAME,
    PROXYPORT : PROXYPORT
};

eyeball.io.set('log level',1);

app.locals = {
    env : app.settings.env,
    version : pkg.version,
    host : "http://"+HOSTNAME+":"+PORT,
    timestamp : new Date().getTime()
};

http.createServer(function(req, res) {

    var options = {
        url : req.url,
        method : req.method
    };

    options.headers = {
        'user-agent' : req.headers['user-agent'],
        'accept' : req.headers['accept']
    };

    if(req.headers['x-eyeball-pass'] === "0") {
        options.headers['pragma'] = 'no-cache';
        options.headers['cache-control'] = 'no-cache';
    } else {
        options.headers['if-none-match'] = req.headers['if-none-match'];
        options.headers['if-modified-since'] = req.headers['if-modified-since'];
    }

    request(options,function(err,response) {
        if(err) {
            eyeball.logger.error(err);
            res.end("Error");
            return;
        }
        if(!response) {
            res.end("Error - no response");
            return;
        }
        var headers = response.headers || {};
        headers['x-eyeball-size'] = Buffer.byteLength(response.body,'utf8');
        headers['x-eyeball-status'] = response.statusCode;
        res.writeHead(response.statusCode,headers);
        res.end(response.body);
    });

}).listen(PROXYPORT);

process.on("exit",function() {
    vnu.kill();
});