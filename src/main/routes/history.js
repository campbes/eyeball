var routeHistory = function(req,res) {

    var url = require('url');
    var mongojs = require('mongojs');
    var reportCfg = require('../conf/report');

    var queryString = url.parse(req.url, true).query || {};
    var dbQuery = {
        _id : mongojs.ObjectId(queryString.id)
    };

    return eyeball.DB.find(dbQuery,{url : 1},function(err,results) {
        if(err) {
            res.send(err);
        }
        dbQuery = {
            url : results[0].url
        };
        var cfg = {
            url : 1,
            timestamp: 1,
            build : 1,
            tag : 1
        };

        var i= 0,rep;

        for(i=reportCfg.reports.length-1; i>=0; i--) {
            rep = reportCfg.reports[i];
            cfg["metrics."+rep+".tool"] = 1;
            cfg["metrics."+rep+".grades"] = 1;
        }
        eyeball.DB.find(dbQuery,cfg,function(err,data) {
            if(err) {
                res.send(err);
            }
            res.send(JSON.stringify(data));
        });

        return cfg;
    });

};

module.exports = routeHistory;