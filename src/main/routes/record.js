var EyeballRoutesRecord = (function(){

    var url = require('url');
    var mongojs = require('mongojs');
    var path = require('path');
    var viewCfg = require('../conf/view');

    function getDbQuery(id) {
        return {
            _id : mongojs.ObjectId(id)
        };
    }

    var recordGet = function(req,res) {
        res.setHeader("Access-Control-Allow-Origin","*");
        res.setHeader("Access-Control-Allow-Methods","GET");
        res.setHeader("Content-type","application/json");

        var YSLOW = require('yslow').YSLOW;
        var parsedUrl = url.parse(req.url,true);
        var id = path.basename(parsedUrl.pathname);
        var queryString = parsedUrl.query || {};
        var view = queryString.view;

        return eyeball.DB.find(getDbQuery(id),function(err,results) {
            if(err) {
                res.status(500).send(err);
                return null;
            }
            if(results.length === 0) {
                res.status(404).send("Not found");
                return null;
            }
            var data = results[0];

            if(view && viewCfg[view]) {
                data = viewCfg[view](data);
            } else {
                // do the yslow rule additions bewfore returning
                var i;
                var metrics = data.metrics.yslow.data.g;
                for (i in metrics) {
                    if(metrics.hasOwnProperty(i)) {
                        data.metrics.yslow.data.g[i].rule = YSLOW.doc.rules[i].name;
                    }
                }
            }

            res.send(JSON.stringify(data));
            return data;
        });

    };

    var recordDelete = function(req,res) {
        var id = path.basename(url.parse(req.url).pathname);
        return eyeball.DB.remove(getDbQuery(id),function(err) {
            if(err) {
                res.status(500).send(err);
                return null;
            }
            res.send("Deleted "+id);
            return id;
        });
    };

    return {
        recordGet : recordGet,
        recordDelete : recordDelete,
        getDbQuery : getDbQuery
    };

}());

exports.get = EyeballRoutesRecord.recordGet;
exports.delete = EyeballRoutesRecord.recordDelete;