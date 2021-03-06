var EyeballRoutesTest = function(req,res) {

    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","POST");

    var build = (new Date()).getTime().toString() + (Math.random()*10).toString();
    res.send({build : build});

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
        // allow for crlf and lf
        data = data.replace('\r\n','\n');
        data = data.trim();
        urls = data.split("\n");

        if(reps) {
            var urlset = urls;
            var i = 0;
            for(i=0; i<reps; i++) {
                urls = urls.concat(urlset);
            }
        }
        var cfg = {
            build : build,
            tag : tag,
            url : url,
            urls : urls
        };
        TestCtrl = require('../controllers/test/test')(cfg);
        TestCtrl.startTests();
        return cfg;
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

    return {
        go : go
    };
};

module.exports = EyeballRoutesTest;