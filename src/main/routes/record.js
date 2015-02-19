var EyeballRoutesRecord = (function(){

    var _ = require('lodash');
    var url = require('url');
    var mongojs = require('mongojs');
    var path = require('path');
    var viewCfg = require('../conf/view');
    var zlib = require('zlib');
    var Q = require('q');

    function getDbQuery(id) {
        var dbQuery = {};
        id = id.split(",");

        id.forEach(function(obj,i) {
            id[i] = mongojs.ObjectId(obj);
        });

        if(id.length > 1) {
            dbQuery._id = {
                $in : id
            };
        } else if (id[0]) {
            dbQuery._id = id[0];
        }
        return dbQuery;
    }

    function inflate(buffer,metric) {
        var deferred = Q.defer();
        zlib.inflate(buffer,function(err,buffer) {
            deferred.resolve({
                metric : metric,
                data : JSON.parse(buffer.toString())
            });
        });
        return deferred.promise;
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
        var fields = queryString.fields;

        var cfg = {};

        if(fields) {
            cfg = _.extend(cfg,require('../util').buildProjection(fields));
        }

        return eyeball.DB.find(getDbQuery(id),cfg,function(err,results) {
            if(err) {
                res.status(500).send(err);
                return null;
            }
            if(results.length === 0) {
                res.status(404).send("Not found");
                return null;
            }

            var decompress = [];

            results.forEach(function(data,index) {

                function reapplyData(obj) {
                    data.metrics[obj.metric].data = obj.data;
                }

                var metric;
                var def;
                for(metric in data.metrics) {
                    if(data.metrics.hasOwnProperty(metric) && data.metrics[metric].compressed) {
                        def = inflate(data.metrics[metric].data.buffer,metric);
                        def.then(reapplyData);
                        decompress.push(def);
                    }
                }

                if(view && viewCfg[view]) {
                    data = viewCfg[view](data);
                } else if(data.metric && data.metrics.yslow) {
                    // do the yslow rule additions bewfore returning
                    var i;
                    var metrics = data.metrics.yslow.data.g;
                    for(i in metrics) {
                        if(metrics.hasOwnProperty(i)) {
                            data.metrics.yslow.data.g[i].rule = YSLOW.doc.rules[i].name;
                        }
                    }
                }

                results[index] = data;

            });

            Q.all(decompress).then(function() {
                res.send(JSON.stringify((results.length > 1 ? results : results[0])));
            });

            return results;
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