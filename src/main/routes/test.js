/*global window,document*/
// window and document are used by phantom

var request = require('request');

var phantomjs = require('phantomjs');
var phantom = require('node-phantom');
var fs = require('fs');

var testRoute = function(req,res) {

    var build = req.body.build;
    var datafile = req.body.datafile;
    var url = req.body.url;
    var reps = req.body.reps;
    var tag = req.body.tag || '';
    var regex = req.body.regex;
    var regexReplace = req.body.regexReplace;

    var urls = null;
    var urlsLength = 0;

    var erroredUrls = [];

    var TestCtrl;

    var activeTests = {};

    function openPage(ph) {
        eyeball.logger.info("Opening page with "+ph._phantom.pid);
        var passes = [];

        var pageUrl = urls.splice(0,1)[0];

        activeTests[ph._phantom.pid] = pageUrl;

        function createPage(pass,url) {
            ph.createPage(function(err,page) {
                if(err) {
                    eyeball.logger.info(err);
                }

                page = TestCtrl.page.setup(page);

                if(pass === 0){
                    page.customHeaders = {
                        "Cache-Control" : "no-cache, no-store, must-revalidate",
                        "Pragma" : "no-cache",
                        "Expires" : 0
                    };
                }

                var webpage = {};

                webpage.address = url;
                webpage.startTime = new Date();
                page.open(webpage.address, function (err,status) {
                    if(err) {
                        eyeball.logger.info(err);
                    }
                    if (status !== 'success') {
                        eyeball.logger.info('FAIL to load the address');
                        ph.exit(1);
                        erroredUrls.push(url);
                    } else {
                        webpage.endTime = new Date();
                        page.evaluate(function () {
                            return {
                                title : document.title,
                                content : document.documentElement.outerHTML,
                                onContentLoad : window.DOMContentLoaded
                            };
                        },function(err,doc){
                            if(err) {
                                console.log(err);
                                erroredUrls.push(url);
                            }
                            webpage.title = doc.title;
                            webpage.content = doc.content;
                            webpage.onContentLoad = new Date(doc.onContentLoad);
                            webpage.resources = [].concat(page.resources);

                            webpage.EYEBALLTEST = {};

                            TestCtrl.runInPageTests(webpage,page,function() {
                                page.close();
                                passes[pass] = webpage;
                                if(pass === 0) {
                                    createPage(1,url);
                                } else if(pass === 1) {
                                    TestCtrl.record.create(passes);
                                    delete activeTests[ph._phantom.pid];
                                    if(urls.length > 0) {
                                        openPage(ph);
                                    } else {
                                        ph.exit();
                                    }
                                }
                            });

                        });

                    }
                });
            });
        }

        createPage(0,pageUrl);
    }

    var retriedErrors = false;
    var phantomMax = 5;
    var activePhantoms = [];

    var endTests;

    function startPhantom() {

        if(activePhantoms.length >= phantomMax) {
            return;
        }

        phantom.create(function(err,ph) {
            if(err) {
                eyeball.logger.info(err);
            }
            activePhantoms.push(ph);
            ph.onError = function(err,trace) {
                eyeball.logger.info("Phantom error: "+err);
                ph.exit(1);
                if(urls.length > 0) {
                    startPhantom();
                }
            };
            ph.on("error",function(err,trace) {
                eyeball.logger.info("Phantom error: "+err);
                ph.exit(1);
                if(urls.length > 0) {
                    startPhantom();
                }
            });
            ph.on("exit",function(msg) {
                eyeball.logger.info("Phantom Exit: "+ph._phantom.pid+ "("+msg+")");

                if(activeTests[ph._phantom.pid]) {
                    console.log(activeTests[ph._phantom.pid]);
                    if(erroredUrls) {
                        erroredUrls.push(activeTests[ph._phantom.pid]);
                    }
                    delete activeTests[ph._phantom.pid];
                }
                var i = 0;
                for(i=0; i<activePhantoms.length; i++) {
                    if(activePhantoms[i] === ph) {
                        activePhantoms.splice(i,1);
                    }
                }

                if(urls.length > 0) {
                    startPhantom();
                } else if(activePhantoms.length === 0) {
                    endTests();
                }

            });
            openPage(ph);
            eyeball.logger.info("Active Phantoms: "+activePhantoms.length);
            if(urls.length > 0) {
                startPhantom();
            }
        }, {
            phantomPath : phantomjs.path
        });
    }

    function cleanupRecordsAndEnd() {
        console.log(activePhantoms.length);

        if(!retriedErrors && erroredUrls.length > 0) {
            // give the failures one more go
            console.log("Retrying errored urls...");
            urls = [].concat(erroredUrls);
            erroredUrls = [];
            retriedErrors = true;
            startPhantom();
            return;
        }

        setTimeout(function(){
            var fs = require("fs");
            var i=0;
            for(i = activePhantoms.length-1; i>=0; i--) {
                activePhantoms[i].exit();
            }
            for(i = TestCtrl.testers.internal.activeVnus.length-1; i>=0; i--) {
                TestCtrl.testers.internal.activeVnus[i].kill();
            }
            for(i = TestCtrl.testers.internal.validatorFiles.length-1; i>=0; i--) {
                fs.unlink(TestCtrl.testers.internal.validatorFiles[i]);
            }

            if(erroredUrls.length > 0) {
                console.log("Forcing test finish");
                eyeball.io.sockets.volatile.emit('commitRecord_'+build,{
                    committed : TestCtrl.record.committedRecords.length,
                    total : urlsLength,
                    progress : 100
                });
            }
        },30000);

    }

    endTests = cleanupRecordsAndEnd;

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

        urlsLength = urls.length;

        TestCtrl = require('../controllers/test/test')({
            build : build,
            tag : tag,
            urlsLength : urlsLength
        });

        if(urlsLength < phantomMax) {
            phantomMax = urlsLength;
        }

        startPhantom();

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