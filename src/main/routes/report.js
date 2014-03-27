function getDbQuery(req) {
    var url = require('url');
    var queryString = url.parse(req.url, true).query || {};
    var dbQuery = {};

    function getMultiValues(key) {
        var val = queryString[key];
        if(val) {
            if(typeof val === "string" && val.indexOf(",") !== -1) {
                val = val.split(",");
            }
            if(typeof val  === "string") {
                return val;
            }
            return {
                $in : val
            };
        }
        return null;
    }

    var build = getMultiValues("build");
    var tag = getMultiValues("tag");
    var start = (queryString.start ? new Date(queryString.start) : "");
    var end = (queryString.end ? new Date(new Date(queryString.end).getTime() + 86399999) : "");

    if(build) {
        dbQuery.build = build;
    }
    if(tag) {
        dbQuery.tag = tag;
    }

    if(start && end) {
        dbQuery.timestamp = {
            $gte : start, $lte : end
        };
    } else if (start) {
        dbQuery.timestamp = {
            $gte : start
        };
    } else if (end) {
        dbQuery.timestamp = {
            $lte : end
        };
    }

    if(queryString.urlExact && queryString.url) {
        dbQuery.url = queryString.url;
    } else if (queryString.url) {
        dbQuery.url = {
            $regex : queryString.url
        };
    }

    return dbQuery;
}

var routeReportOverview = function(req,res) {

    var dbQuery = getDbQuery(req);
    var cfg = {
        url : 1,
        timestamp: 1,
        build : 1,
        tag : 1
    };

    var i= 0,rep;
    var reportCfg = require('../conf/report');

    for(i=reportCfg.reports.length-1; i>=0; i--) {
        rep = reportCfg.reports[i];
        cfg["metrics."+rep+".tool"] = 1;
        cfg["metrics."+rep+".grades"] = 1;
    }
    eyeball.DB.find(dbQuery,cfg,{
            limit : 1000
        }).sort({timestamp : -1},
        function(err,results) {
            if(err) {
                res.send(err);
            }
            //console.log(results.length);
            res.send(JSON.stringify(results));
        });

};

var routeReportStandard = function(req,res,name) {
    var dbQuery = getDbQuery(req);
    var cfg = {
        url : 1,
        timestamp: 1,
        build : 1,
        tag : 1
    };
    cfg["metrics."+name] = 1;

    eyeball.DB.find(dbQuery,cfg,{
        limit : 1000
    }).sort({timestamp : -1},
        function(err,results) {
            if(err) {
                res.send(err);
            }
            //console.log(results.length);
            res.send(JSON.stringify(results));
        });
};

exports.overview = routeReportOverview;
exports.standard = routeReportStandard;
