var url = require('url');
var mongojs = require('mongojs');
var YSLOW = require('yslow').YSLOW;

module.exports = function(req,res) {

    var queryString = url.parse(req.url, true).query || {};
    var dbQuery = {
        _id : mongojs.ObjectId(queryString.id)
    };

    DB.find(dbQuery,function(err,results) {
        if(err) {
            res.send(err);
        }

        // do the yslow rule additions bewfore returning
        var data = results[0];
        for (var i in data.metrics.yslow.data.g) {
            data.metrics.yslow.data.g[i].rule = YSLOW.doc.rules[i].name;
        }

        res.send(JSON.stringify(data));
    });

};