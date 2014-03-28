var EyeballRoutesReportOverview = function(req,res) {

    var dbQuery = require('../util').getDbQuery(req);
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

var EyeballRoutesReportStandard = function(req,res,name) {
    var dbQuery = require('../util').getDbQuery(req);
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

exports.overview = EyeballRoutesReportOverview;
exports.standard = EyeballRoutesReportStandard;
