var EyeballUtil = function() {

    function getDbQuery(req) {
        var url = require('url');
        var mongojs = require('mongojs');
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
            dbQuery.url = decodeURIComponent(queryString.url);
        } else if (queryString.url) {
            dbQuery.url = {
                $regex: decodeURIComponent(queryString.url.replace('?','.'))
            };
        }

        if(queryString.id) {
            var id = queryString.id.split(",");
            var i;
            for(i=id.length-1; i>=0;i--) {
                id[i] = mongojs.ObjectId(id[i]);
            }
            if(id.length > 1) {
                dbQuery._id = {
                    $in : id
                };
            } else if (id[0]) {
                dbQuery._id = id[0];
            }
        }

        return dbQuery;
    }

    function buildProjection(fields) {
        var proj = {}, i;
        fields = fields.split(",");
        for(i=fields.length-1; i>=0; i--) {
            if(fields[i].substr(0,1) === '-') {
                proj[fields[i].substr(1)] = 0;
            } else {
                proj[fields[i]] = 1;
            }
        }
        return proj;
    }

    return {
        getDbQuery : getDbQuery,
        buildProjection : buildProjection
    };

};

module.exports = EyeballUtil();