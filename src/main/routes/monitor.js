var url = require('url');
var mongojs = require('mongojs');
var YSLOW = require('yslow').YSLOW;

module.exports = function(req,res) {

    DB.stats(function(err,data) {
        if(err) {
            res.send(err);
        }
        res.send(JSON.stringify(data));
    });

};