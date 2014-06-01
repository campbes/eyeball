var EyeballRoutesHistory = function(req,res) {

    var url = require('url');
    var mongojs = require('mongojs');
    var reportCfg = require('../conf/report');

    var id = url.parse(req.url).path.match(/[A-z0-9]{24}/)[0];

    var dbQuery = {
        _id : mongojs.ObjectId(id)
    };

    return eyeball.DB.find(dbQuery,{url : 1},function(err,results) {
        if(err) {
            res.status(500).send(err);
        }
        if(results.length === 0) {
            res.status(404).send("Not found");
            return null;
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
                res.status(500).send(err);
                return null;
            }
            res.send(JSON.stringify(data));
            return data;
        });

        return cfg;
    });

};

module.exports = EyeballRoutesHistory;