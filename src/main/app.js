/*require('nodetime').profile({
    accountKey: '12ebb2588385344195a18a6b67657081112052e8',
    appName: 'Node.js Application'
});*/
var HOSTNAME = process.env.HOSTNAME || "http://localhost";
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
app.get('/v*/results/*/history', require('./routes/history'));
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
var vnu = exec('java -Xss1024k -cp ./lib/vnu.jar nu.validator.servlet.Main 8888',
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
    io : null,
    logger : winston,
    handleExceptions : true,
    DB : DB,
    HOSTNAME : HOSTNAME,
    PROXYPORT : PROXYPORT
};
app.locals = {
    env : app.settings.env,
    version : pkg.version,
    host : HOSTNAME+":"+PORT,
    timestamp : new Date().getTime()
};

require('socket.io')(server).on('connection',function(socket) {
    eyeball.io = socket;
});

var proxyCache = {};

var proxyCookies = '';

http.createServer(function(req, res) {

    var options = {
        url : req.url,
        method : req.method,
        followRedirect : false
    };

    options.headers = {
        'user-agent' : req.headers['user-agent'],
        'accept' : req.headers.accept,
        'cookie' : proxyCookies
    };

    var cacheKey = req.url+":"+req.headers["x-eyeball-timestamp"];
    var cachedResource = proxyCache[cacheKey];

    if(req.headers['x-eyeball-pass'] === "1" && cachedResource) {
        options.headers['if-none-match'] = cachedResource.headers.etag;
        options.headers['if-modified-since'] = cachedResource.headers['last-modified'];
    }

    var responseData;

    request(options,function(err,response) {
        if(err) {
            res.end("Error");
            return;
        }
        if(!response) {
            res.end("Error - no response");
            return;
        }
        response.responseData = responseData;
        if(!cachedResource) {
            proxyCache[cacheKey] = response;
        }
        var headers = (cachedResource ? cachedResource.headers : response.headers);
        headers['x-eyeball-size'] = headers['x-eyeball-size'] || headers['content-length'] || Buffer.byteLength(response.body,'utf8');
        headers['x-eyeball-status'] = response.statusCode;
        res.writeHead(response.statusCode,headers);
        res.end((cachedResource ? cachedResource.responseData : responseData));

        if(cachedResource) {
            delete proxyCache[cacheKey];
        }

    }).on('data',function(data) {
        if(responseData) {
            responseData = Buffer.concat([responseData,data]);
        } else {
            responseData = data;
        }
    });

}).listen(PROXYPORT);

process.on("exit",function() {
    vnu.kill();
});