var url = require('url');
var mongojs = require('mongojs');

module.exports = function(req,res) {

    var queryString = url.parse(req.url, true).query || {};
    var dbQuery = {
        _id : mongojs.ObjectId(queryString.id)
    };

    DB.find(dbQuery,function(err,results) {
        if(err) {
            res.send(err);
        }

        res.send(JSON.stringify(results[0]));
    });

};