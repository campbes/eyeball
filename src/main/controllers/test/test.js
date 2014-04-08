/*global window, document*/

var EyeballControllersTestTest = function(params) {

    params = params || {};
    var urls = params.urls;
    var urlsLength = (urls ? urls.length : 0);
    var build = params.build;
    var erroredUrls = [];
    var activeTests = {};
    var retriedErrors = false;
    var phantomMax = 5;
    var activePhantoms = [];
    var endTests;

    function throwTestError(err,test,ph) {
        eyeball.logger.error(err);
        erroredUrls.push(test.url);
        ph.exit(1);
    }

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
    var Webpage = require('./webpage');

    function Test() {
        this.passes = [];
        this.pageUrl = "";
        this.page = null;
        this.webpage = {};
        return this;
    }

    var completePage;

    function runInPageTest(testObj,tests,callback) {

        var test = tests[0];

        function processInPageTest(err,doc){
            if(err) {
                throwTestError(err);
            }
            testObj.webpage.EYEBALLTEST[test.name] = doc.EYEBALLTEST;
            tests.splice(0,1);
            if(tests.length > 0) {
                runInPageTest(testObj,tests,callback);
            } else {
                clearTimeout(testObj.inPageTestTimer);
                callback();
            }
        }

        testObj.page.injectJs(test.src,function(){
            testObj.page.evaluate(Webpage.getTestData,processInPageTest);
        });
    }

    function runInPageTests(test,callback) {
        test.inPageTestTimer = setTimeout(callback,30000);
        runInPageTest(test,[].concat(TestCfg.tests.browser),callback);
    }

    function addWebpageDetails(err,doc,test,ph){
        if(err) {
            throwTestError(err,test,ph);
        }
        test = Webpage.augment(test,doc);
        runInPageTests(test,function(){
            completePage(test,ph);
        });
    }

    function buildWebpage(err,status,test,ph) {
        if(err) {
            throwTestError(err,test,ph);
        }
        if (status !== 'success') {
            throwTestError("Failed to load url",test,ph);
        } else {
            test.webpage = Webpage.create(test);
            test.page.evaluate(Webpage.details,function(err,doc){
                addWebpageDetails(err,doc,test,ph);
            });
        }
    }

    function testPage(err,page,test,ph) {
        if(err) {
            throwTestError(err,test,ph);
        }
        test.page = Page.setup(page);

        if(test.passes.length === 0){
            test.page.customHeaders = {
                "Cache-Control" : "no-cache, no-store, must-revalidate",
                "Pragma" : "no-cache",
                "Expires" : 0
            };
        }
        test.start = new Date();
        page.open(test.pageUrl,function(err,status) {
            buildWebpage(err,status,test,ph);
        });
    }

    function createPage(test,ph) {
        ph.createPage(function(err,page) {
            testPage(err,page,test,ph);
        });
    }

    function openPage(ph) {
        eyeball.logger.info("Opening page with "+ph._phantom.pid);
        var test = new Test();
        test.pageUrl = urls.splice(0,1)[0];
        activeTests[ph._phantom.pid] = test.pageUrl;
        createPage(test,ph);
    }

    completePage = function(test,ph) {
        test.page.close();
        test.passes[test.passes.length] = test.webpage;
        if(test.passes.length === 1) {
            createPage(test,ph);
            return;
        }
        Record.create(test.passes);
        delete activeTests[ph._phantom.pid];
        if(urls.length > 0) {
            openPage(ph);
        } else {
            ph.exit();
        }
    };

    var startPhantom;

    function phantomExit(msg,ph) {
        var pid = ph._phantom.pid;
        eyeball.logger.info("Phantom Exit: "+pid+ "("+msg+")");
        if(activeTests[pid]) {
            erroredUrls.push(activeTests[pid]);
            delete activeTests[pid];
        }
        var i = 0;
        for(i=activePhantoms.length-1; i>=0; i--) {
            if(activePhantoms[i] === ph) {
                activePhantoms.splice(i,1);
            }
        }
        if(urls.length > 0) {
            startPhantom();
            return;
        }
        if(activePhantoms.length === 0) {
            endTests();
        }
    }

    function phantomError(err,ph) {
        eyeball.logger.info("Phantom error: "+err);
        ph.exit(1);
        if(urls.length > 0) {
            startPhantom();
        }
    }

    function createPhantom(err,ph) {
        if(err) {
            eyeball.logger.error(err);
            return;
        }

        function error(err) {
            phantomError(err,ph);
        }

        ph.onError = error;
        ph.on("error",error);
        ph.on("exit",function(msg) {
            phantomExit(msg,ph);
        });

        activePhantoms.push(ph);
        eyeball.logger.info("Active Phantoms: "+activePhantoms.length);
        openPage(ph);

        if(urls.length > 0) {
            startPhantom();
        }
    }

    startPhantom = function() {
        if(urlsLength < phantomMax) {
            phantomMax = urlsLength;
        }
        if(activePhantoms.length >= phantomMax) {
            return;
        }
        phantom.create(createPhantom, {
            phantomPath : phantomjs.path
        });
    };

    function closeTests(){
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
            eyeball.logger.info("Forcing test finish");
            eyeball.io.sockets.volatile.emit('commitRecord_'+build,{
                committed : Record.committedRecords.length,
                total : urlsLength,
                progress : 100
            });
        }
    }

    endTests = function() {
        if(!retriedErrors && erroredUrls.length > 0) {
            // give the failures one more go
            eyeball.logger.info("Retrying errored urls...");
            urls = [].concat(erroredUrls);
            erroredUrls = [];
            retriedErrors = true;
            startPhantom();
            return;
        }
        setTimeout(closeTests,30000);
    };

    return {
        startTests : startPhantom
    };

};

module.exports = EyeballControllersTestTest;