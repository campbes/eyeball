var routeConfig = function(req,res) {

    res.setHeader("Content-type","text/json");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","GET");

    var config = {
        report : require('../conf/report'),
        test : require('../conf/test')
    };

    res.send(JSON.stringify(config));
    return res;
};

module.exports = routeConfig;