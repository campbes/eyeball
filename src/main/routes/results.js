var EyeballRoutesResults = (function() {

var _ = require('lodash');

function results(req,res) {
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
        limit : 1000
    }).sort({timestamp : -1},
        function(err,results) {
            if(err) {
                res.send(err);
            }
            res.send(JSON.stringify(results));
        });

    };

    function latest(req,res) {
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
                limit : 10000
            }).sort({timestamp : -1},
                function(err,results) {
                    if(err) {
                        res.send(err);
                    }
                    results = _.unique(results,"url");
                    res.send(JSON.stringify(results));
                });
    }

    return {
        results : results,
        latest : latest
    };

}());

exports.results = EyeballRoutesResults.results;
exports.latest = EyeballRoutesResults.latest;