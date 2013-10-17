module.exports = function(req,res) {

    var url = url = require('url');

    function getDbQuery() {
        var queryString = url.parse(req.url, true).query || {};
        dbQuery = {};

        var id = queryString.id;
        if(id) {
            dbQuery._id = mongojs.ObjectId(id);
            return dbQuery;
        }

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

    var dbQuery = getDbQuery();

    DB.find(dbQuery,function(err,results) {
        if(err) {
            res.send(err);
        }
        //console.log(results.length);
        res.send(JSON.stringify(results));
    });

};