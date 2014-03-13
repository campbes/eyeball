/*global window,document*/
// window and document are used by phantom

var request = require('request');

var phantomjs = require('phantomjs');
var phantom = require('node-phantom');
var fs = require('fs');

var TestCtrl = require('../controllers/test')();

module.exports = function(req,res) {

    var build = req.body.build;
    var datafile = req.body.datafile;
    var url = req.body.url;
    var reps = req.body.reps;
    var tag = req.body.tag || '';
    var regex = req.body.regex;
    var regexReplace = req.body.regexReplace;

    var urls = null;
    var urlsLength = 0;
    var committedRecords = [];

    var createdRecords = [];
    var uncommittedRecords = [];
    var erroredUrls = [];

    function commitRecord(record){

        clearTimeout(record.recordTimer);
        delete record.recordTimer;


        eyeball.DB.insert(record,function(err){
            if(err) {
                eyeball.logger.info(err);
            }
            committedRecords.push(record);
            eyeball.logger.info("Emitting..."+build);
            eyeball.io.sockets.volatile.emit('commitRecord_'+build,{
                committed : committedRecords.length,
                total : urlsLength,
                progress : Math.floor((committedRecords.length/urlsLength) * 100),
                record : record
            });
        });
        var i = 0;
        for(i=0; i<uncommittedRecords.length; i++) {
            if(uncommittedRecords[i] === record) {
                uncommittedRecords.splice(i,1);
            }
        }

    }

    function updateRecord(record,property,data) {

        var metric = {
            url : record.url,
            timestamp: new Date(),
            build : build,
            tag : tag,
            tool : property,
            data : data
        };

        metric.grades = TestCtrl.grades.getGradeSet(metric);
        record.metrics[property] = metric;

        var i, test;

        for(i=0; i<TestCtrl.tests.browser.length; i++) {
            test = TestCtrl.tests.browser[i];
            if(!record.metrics[test.name]) {
                eyeball.logger.info("No entry for " + test.name);
                return;
            }
        }

        for(i=0; i<TestCtrl.tests.har.length; i++) {
            test = TestCtrl.tests.har[i];
            if(!record.metrics[test.name]) {
                eyeball.logger.info("No entry for " + test.name);
                return;
            }
        }

        for(i=0; i<TestCtrl.tests.markup.length; i++) {
            test = TestCtrl.tests.markup[i];
            if(!record.metrics[test.name]) {
                eyeball.logger.info("No entry for " + test.name);
                return;
            }
        }

        if(record.recordTimer) {
            commitRecord(record);
        }

    }



    function createHAR(page,callback) {
        var entries = [];

        page.resources.forEach(function (resource) {
            var request = resource.request,
                startReply = resource.startReply,
                endReply = resource.endReply;

            if (!request || !startReply || !endReply) {
                return;
            }

            // Exclude Data URI from HAR file because
            // they aren't included in specification
            if (request.url.indexOf("data:image") > -1) {
                return;
            }

            var time = new Date(endReply.time).getTime() - new Date(request.time).getTime();

            entries.push({
                startedDateTime: request.time,
                time: time,
                request: {
                    method: request.method,
                    url: request.url,
                    httpVersion: "HTTP/1.1",
                    cookies: [],
                    headers: request.headers,
                    queryString: [],
                    headersSize: -1,
                    bodySize: -1
                },
                response: {
                    status: endReply.status,
                    statusText: endReply.statusText,
                    httpVersion: "HTTP/1.1",
                    cookies: [],
                    headers: endReply.headers,
                    redirectURL: "",
                    headersSize: -1,
                    bodySize: startReply.bodySize,
                    content: {
                        size: startReply.bodySize,
                        mimeType: endReply.contentType
                    }
                },
                cache: {},
                timings: {
                    blocked: 0,
                    dns: -1,
                    connect: -1,
                    send: 0,
                    wait: new Date(startReply.time).getTime() - new Date(request.time).getTime(),
                    receive: new Date(endReply.time).getTime() - new Date(startReply.time).getTime(),
                    ssl: -1
                },
                pageref: page.address
            });
        });

       callback({
            log: {
                version: '1.2',
                creator: {
                    name: "PhantomJS",
                    version : "1.9.2"
                },
                pages: [{
                    startedDateTime: page.startTime.toISOString(),
                    id: page.address,
                    title: page.title,
                    pageTimings: {
                        onLoad: page.endTime - page.startTime,
                        onContentLoad : page.onContentLoad - page.startTime
                    }
                }],
                entries: entries
            }
        });
    }

    function combineHARs(hars) {

        var har = hars[0];
        var cachedHar = hars[1];

        function matchEntry(url) {
            var i = 0;
            for(i=cachedHar.log.entries.length-1; i>=0; i--) {
                if(cachedHar.log.entries[i].request.url === url) {
                    return cachedHar.log.entries[i];
                }
            }
            return false;
        }

        cachedHar.log.creator = {
            name : "Eyeball",
            version : "0.0.0"
        };

        var i =0;
        var entry;
        var matched;
        for (i=0; i<har.log.entries.length; i++) {
            matched = matchEntry(har.log.entries[i].request.url);
            if(!matched) {
                entry = {
                    startedDateTime: cachedHar.log.pages[0].startedDateTime,
                    time: 0,
                    request: {
                        method: har.log.entries[i].request.method,
                        url: har.log.entries[i].request.url,
                        httpVersion: "HTTP/1.1",
                        cookies: [],
                        headers: har.log.entries[i].request.headers,
                        queryString: [],
                        headersSize: -1,
                        bodySize: -1
                    },
                    response: {
                        status: '(cache)',
                        statusText: '(cache)',
                        httpVersion: "HTTP/1.1",
                        cookies: [],
                        headers: har.log.entries[i].response.headers,
                        redirectURL: "",
                        headersSize: -1,
                        bodySize: 0,
                        content: {
                            size: har.log.entries[i].response.bodySize,
                            mimeType: har.log.entries[i].response.content.mimeType
                        }
                    },
                    cache: {
                        afterRequest : har.log.entries[i].response.bodySize
                    },
                    timings: {
                        blocked: 0,
                        dns: 0,
                        connect: 0,
                        send: 0,
                        wait: 0,
                        receive: 0,
                        ssl: -1
                    },
                    pageref: har.log.entries[i].pageref
                };

                cachedHar.log.entries.push(entry);
            }
        }

        return cachedHar;
    }


    function createRecord(passes) {

        var record = {
            url : passes[1].address,
            timestamp: new Date(),
            build : build,
            tag : tag,
            metrics : {}
        };

        createdRecords.push(record);
        uncommittedRecords.push(record);

        record.recordTimer = setTimeout(function(){
            console.log("Gave up waiting for metrics");
            commitRecord(record);
        },30000);

        var harUncached = null;
        var harCached = null;

        function runTestSet(testSet,data) {
            var i= 0, test;
            var cbMaker = function(name) {
                return function(res) {
                    updateRecord(record,name,res);
                };
            };
            for(i=0; i<testSet.length; i++) {
                test = testSet[i];
                test.extractor(data,cbMaker(test.name));
                eyeball.logger.info('got '+test.name+' result');
            }
        }

        createHAR(passes[0],function(har1) {
            harUncached = har1;
            createHAR(passes[1],function(har2) {
                harCached = combineHARs([har1,har2]);
                eyeball.logger.info("created har");
                updateRecord(record,'har',harCached);
                updateRecord(record,'harUncached',harUncached);
                updateRecord(record,'time',{
                    lt : harCached.log.pages[0].pageTimings.onLoad,
                    dt :  harCached.log.pages[0].pageTimings.onContentLoad,
                    lt_u : harUncached.log.pages[0].pageTimings.onLoad,
                    dt_u :  harUncached.log.pages[0].pageTimings.onContentLoad
                });
                runTestSet(TestCtrl.tests.har,harUncached);
            });
        });


        runTestSet(TestCtrl.tests.browser,passes[1]);
        runTestSet(TestCtrl.tests.markup,passes[1]);

    }



    function setupPage(page) {
        page.resources = [];
        page.libraryPath = "../";
        page.settings = {
            resourceTimeout : 5
        };

        page.onResourceRequested = function (req) {
            page.resources[req[0].id] = {
                request: req[0],
                startReply: null,
                endReply: null
            };
        };

        page.onResourceReceived = function (res) {
            if(!page.resources[res.id]) {
                return;
            }
            if (res.stage === 'start') {
                page.resources[res.id].startReply = res;
            }
            if (res.stage === 'end') {
                page.resources[res.id].endReply = res;
            }
        };

        page.setFn('onCallback',function(msg) {
            if(msg === "DOMContentLoaded") {
                page.evaluate(function(){
                    window.DOMContentLoaded = new Date().getTime();
                });
            }
        });

        page.setFn('onInitialized',function(){
            page.evaluate(function() {
                document.addEventListener('DOMContentLoaded', function() {
                    window.callPhantom('DOMContentLoaded');
                }, false);
            });
        });

        return page;
    }

    var activeTests = {};

    function runInPageTest(webpage,page,tests,callback) {
        var test = tests[0];

        page.injectJs(test.src,function(){
            page.evaluate(function() {
                return {
                    EYEBALLTEST : window.EYEBALLTEST
                };
            },function(err,doc){
                if(err) {
                    erroredUrls.push(url);
                }
                webpage.EYEBALLTEST[test.name] = doc.EYEBALLTEST;

                tests.splice(0,1);
                if(tests.length > 0) {
                    runInPageTest(webpage,page,tests,callback);
                } else {
                    clearTimeout(webpage.inPageTestTimer);
                    callback();
                }
            });
        });
    }

    function runInPageTests(webpage,page,callback) {
        webpage.inPageTestTimer = setTimeout(callback,30000);
        webpage.EYEBALLTEST = {};
        runInPageTest(webpage,page,[].concat(TestCtrl.tests.browser),callback);
    }



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

                page = setupPage(page);

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

                            runInPageTests(webpage,page,function() {
                                page.close();
                                passes[pass] = webpage;
                                if(pass === 0) {
                                    createPage(1,url);
                                } else if(pass === 1) {
                                    createRecord(passes);
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
            for(i = TestCtrl.activeVnus.length-1; i>=0; i--) {
                TestCtrl.activeVnus[i].kill();
            }
            for(i = TestCtrl.validatorFiles.length-1; i>=0; i--) {
                fs.unlink(TestCtrl.validatorFiles[i]);
            }

            if(erroredUrls.length > 0) {
                console.log("Forcing test finish");
                eyeball.io.sockets.volatile.emit('commitRecord_'+build,{
                    committed : committedRecords.length,
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