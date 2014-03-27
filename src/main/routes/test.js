var request = require('request');
var fs = require('fs');

var testRoute = function(req,res) {

    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","POST");

    var build = req.body.build;
    var datafile = req.body.datafile;
    var url = req.body.url;
    var reps = req.body.reps;
    var tag = req.body.tag || '';
    var regex = req.body.regex;
    var regexReplace = req.body.regexReplace;

    var urls = null;
    var TestCtrl;

    function go(data) {
        if(regex) {
            regexReplace = regexReplace || "";
            data = data.replace(new RegExp(regex,"g"),regexReplace);

        }
        urls = data.split("\r\n");
        if(reps) {
            var urlset = urls;
            var i = 0;
            for(i=0; i<reps; i++) {
                urls = urls.concat(urlset);
            }
        }
        TestCtrl = require('../controllers/test/test')({
            build : build,
            tag : tag,
            url : url,
            urls : urls
        });

        TestCtrl.startTests();
    }

    if (url) {
        go(url);
    } else if(datafile.indexOf("http") > -1) {
        var http = require('http');
        var fileData = "";
        http.get(datafile,function(res) {
            res.on("data",function(data) {
                fileData += data.toString();
            });
            res.on("end",function() {
                go(fileData);
            });
        });
    } else if (datafile) {
        var fs = require("fs");
        fs.readFile(datafile,'utf8',function(err,data) {
            go(data);
        });
    }

    res.send("OK");
};

module.exports = testRoute;