var EyeballRoutesResults = (function() {

var _ = require('lodash');
var resultsType = "results";

function results(req,res,resultsType) {
    resultsType = resultsType || "results";
    var url = require('url');
    var queryString = url.parse(req.url, true).query || {};
    var fields = queryString.fields;
    var i = 0;

    var dbQuery = require('../util').getDbQuery(req);
    var cfg = {
        url : 1,
        timestamp: 1,
        build : 1,
        tag : 1
    };

    if(fields) {
        fields = fields.split(",");
        for(i=fields.length-1; i>=0; i--) {
            cfg[fields[i]] = 1;
        }
    } else {
        var rep;
        var reportCfg = require('../conf/report');
        for(i=reportCfg.reports.length-1; i>=0; i--) {
            rep = reportCfg.reports[i];
            cfg["metrics."+rep+".tool"] = 1;
            cfg["metrics."+rep+".grades"] = 1;
        }
    }

    eyeball.DB.find(dbQuery,cfg,{
        limit : (resultsType === "latest" ? 10000 : 1000)
    }).sort({timestamp : -1},
        function(err,results) {
            if(err) {
                res.send(err);
            }
            if(resultsType === "latest") {
                results = _.unique(results,"url");
            }
            res.setHeader("Access-Control-Allow-Origin","*");
            res.setHeader("Access-Control-Allow-Methods","GET");
            res.setHeader("Content-type","application/json");
            res.setHeader("Cache-control","max-age=3600,must-revalidate");
            res.setHeader("Last-modified",results[0].timestamp);
            if(!req.get("if-modified-since") || new Date(results[0].timestamp).setMilliseconds(0)  > new Date(req.get("if-modified-since"))) {
                res.send(JSON.stringify(results));
            } else {
                res.send(304);
            }
        });

    };

    function latest(req,res) {
        results(req,res,"latest");
    }

    return {
        results : results,
        latest : latest
    };

}());

exports.results = EyeballRoutesResults.results;
exports.latest = EyeballRoutesResults.latest;