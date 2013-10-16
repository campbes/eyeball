module.exports = function(req,res) {

    var url = url = require('url');
    var query = url.parse(req.url, true).query || {};

    var dbQuery = {};

    if(query.build) {
        dbQuery.build = query.build.toString();
    }

    DB.find(dbQuery,function(err,results) {
        if(err) {
            res.send(err);
        }
        console.log(results.length);
        res.send(JSON.stringify(results));
    });

};