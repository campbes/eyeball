module.exports = function(req,res) {

    res.setHeader("Content-type","text/json");
    var config = {
        report : require('../conf/report'),
        test : require('../conf/test')
    };

    res.send(JSON.stringify(config));

};