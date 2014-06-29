var configView = function() {

    var reportCfg = require('./report');

    function stripHar(har) {
        har.data.log.entries.forEach(function(entry) {
            delete entry.request.headers;
            delete entry.response.headers;
            delete entry.pageref;
        });
        return har;
    }

    function accessObject(obj,str) {

        if(!obj){
            return null;
        }
        var keys = str.split(".");
        var keysLength = keys.length;
        if(keys.length === 1) {
            return obj[keys[0]];
        }
        var i = null;
        for (i=0; i<keysLength; i++) {
            obj = obj[keys[i]] || obj;
        }
        return obj;
    }

    function bookmarklet(data) {
        var view = {
            build : data.build,
            metrics : [],
            har : stripHar(data.metrics.har),
            harUncached : stripHar(data.metrics.harUncached)
        };
        var metric;
        reportCfg.fields.overview.items.forEach(function(obj) {
            metric = {
                name : reportCfg.fields[obj].name,
                grade : data.metrics[obj].grades[reportCfg.fields[obj].metric],
                items : []
            };
           reportCfg.fields[obj].items.forEach(function(item) {
                metric.items.push({
                    name : item.name,
                    grade : accessObject(data.metrics[obj].grades,item.metric)
                });
            });
            view.metrics.push(metric);
        });
        return view;
    }

    return {
        bookmarklet : bookmarklet
    };
};

module.exports = configView();