var url = require('url');

function getDbQuery(req) {
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
            } else {
                return {
                    $in : val
                }
            }

        }
        return null;
    }

    var build = getMultiValues("build");
    var tag = getMultiValues("tag");
    var start = (queryString.start ? new Date(queryString.start) : "");
    var end = (queryString.end ? new Date(queryString.end) : "");

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

    if(queryString.url) {
        dbQuery.url = queryString.url
    } else if(queryString.urlRegex) {
        dbQuery.url = {
            $regex : queryString.urlRegex
        };
    }

    return dbQuery;
}

exports.overview = function(req,res) {

    var dbQuery = getDbQuery(req);

    DB.find(dbQuery,{
        url : 1,
        timestamp: 1,
        build : 1,
        tag : 1,
        "metrics.yslow.tool" : 1,
        "metrics.dommonster.tool" : 1,
        "metrics.validator.tool" : 1,
        "metrics.yslow.data.lt" : 1,
        "metrics.yslow.grades" : 1,
        "metrics.dommonster.grades" : 1,
        "metrics.validator.grades" : 1
        },function(err,results) {
            if(err) {
                res.send(err);
            }
            //console.log(results.length);
            res.send(JSON.stringify(results));
    });

};

exports.yslow = function(req,res) {

    var dbQuery = getDbQuery(req);

    DB.find(dbQuery,{
        url : 1,
        timestamp: 1,
        build : 1,
        tag : 1,
        "metrics.yslow" : 1
    },function(err,results) {
        if(err) {
            res.send(err);
        }
        //console.log(results.length);
        res.send(JSON.stringify(results));
    });

};
