var routeDetail = function(req,res) {

    var YSLOW = require('yslow').YSLOW;
    var util = require('../util');

    var dbQuery = util.getDbQuery(req);

    return eyeball.DB.find(dbQuery,function(err,results) {
        if(err) {
            res.send(err);
        }

        // do the yslow rule additions bewfore returning
        var data = results[0];
        var i;
        var metrics = data.metrics.yslow.data.g;
        for (i in metrics) {
            if(metrics.hasOwnProperty(i)) {
                data.metrics.yslow.data.g[i].rule = YSLOW.doc.rules[i].name;
            }
        }
        res.send(JSON.stringify(data));
        return data;
    });

};

module.exports = routeDetail;