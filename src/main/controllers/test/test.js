/*global window, document*/

var testController = function(params) {

    params = params || {};
    var url = params.url;
    var urls = params.urls;
    var urlsLength = (urls ? urls.length : 0);
    var build = params.build;
    var erroredUrls = [];
    var activeTests = {};
    var retriedErrors = false;
    var phantomMax = 5;
    var activePhantoms = [];
    var endTests;

    var TestCfg = require('../../conf/test');
    var Page = require('./page');
    var Record = require('./record')(
        params.build,
        params.tag,
        urlsLength
    );
    var Testers = require('./testers');
    var phantomjs = require('phantomjs');
    var phantom = require('node-phantom');

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
        runInPageTest(webpage,page,[].concat(TestCfg.tests.browser),callback);
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

                page = Page.setup(page);

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

                function completeWebpage() {
                    page.close();
                    passes[pass] = webpage;
                    if(pass === 0) {
                        createPage(1,url);
                    } else if(pass === 1) {
                        Record.create(passes);
                        delete activeTests[ph._phantom.pid];
                        if(urls.length > 0) {
                            openPage(ph);
                        } else {
                            ph.exit();
                        }
                    }
                }

                function getWebpageDetails() {
                    return {
                        title : document.title,
                        content : document.documentElement.outerHTML,
                        onContentLoad : window.DOMContentLoaded
                    };
                }

                function addWebpageDetails(err,doc){
                    if(err) {
                        console.log(err);
                        erroredUrls.push(url);
                    }
                    webpage.title = doc.title;
                    webpage.content = doc.content;
                    webpage.onContentLoad = new Date(doc.onContentLoad);
                    webpage.resources = [].concat(page.resources);
                    webpage.EYEBALLTEST = {};

                    runInPageTests(webpage,page,completeWebpage);
                }

                function buildWebpage(err,status) {
                    if(err) {
                        eyeball.logger.info(err);
                    }
                    if (status !== 'success') {
                        eyeball.logger.info('FAIL to load the address');
                        ph.exit(1);
                        erroredUrls.push(url);
                    } else {
                        webpage.endTime = new Date();
                        page.evaluate(getWebpageDetails,addWebpageDetails);

                    }
                }

                page.open(webpage.address,buildWebpage);
            });
        }

        createPage(0,pageUrl);
    }



    function startPhantom() {

        if(urlsLength < phantomMax) {
            phantomMax = urlsLength;
        }

        if(activePhantoms.length >= phantomMax) {
            return;
        }

        phantom.create(function(err,ph) {
            if(err) {
                eyeball.logger.info(err);
            }

            function handlePhantomError(err) {
                eyeball.logger.info("Phantom error: "+err);
                ph.exit(1);
                if(urls.length > 0) {
                    startPhantom();
                }
            }

            function phantomExit(msg) {
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

            }

            activePhantoms.push(ph);
            ph.onError = handlePhantomError;
            ph.on("error",handlePhantomError);
            ph.on("exit",phantomExit);
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
            for(i = Testers.internal.activeVnus.length-1; i>=0; i--) {
                Testers.internal.activeVnus[i].kill();
            }
            for(i = Testers.internal.validatorFiles.length-1; i>=0; i--) {
                fs.unlink(Testers.internal.validatorFiles[i]);
            }

            if(erroredUrls.length > 0) {
                console.log("Forcing test finish");
                eyeball.io.sockets.volatile.emit('commitRecord_'+build,{
                    committed : Record.committedRecords.length,
                    total : urlsLength,
                    progress : 100
                });
            }
        },30000);

    }

    endTests = cleanupRecordsAndEnd;

    return {
        startTests : startPhantom
    };

};

module.exports = testController;