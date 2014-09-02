/*global window, document*/

var EyeballControllersTestTest = function(params) {

    params = params || {};
    var urls = params.urls;
    var urlsLength = (urls ? urls.length : 1);
    var build = params.build;
    var erroredUrls = [];
    var activeTests = {};
    var retriedErrors = false;
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

    var Webpage = require('./webpage');
    var Phantom = require('./phantom');
    var Validator = require('./validator');

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

        if(test.src) {
            testObj.page.injectJs(test.src,function(){
                testObj.page.evaluate(Webpage.getTestData,processInPageTest);
            });
        } else {
            testObj.page.evaluate(Webpage.getTestData,processInPageTest);
        }

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
        if(urls.length === 0 ) {
            ph.exit();
            return;
        }
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

    function closeTests(){
        Phantom.end();
        Validator.end();
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
            Phantom.request();
            return;
        }
        setTimeout(closeTests,1200000);
    };

    var startTests;

    function createPhantom(ph) {
        openPage(ph);
        startTests();
    }

    function phantomExit(pid) {
        if(activeTests[pid]) {
            erroredUrls.push(activeTests[pid]);
            delete activeTests[pid];
        }
        startTests();
    }

    startTests = function() {
        if(urls.length > 0) {
            Phantom.request(createPhantom,phantomExit);
            return true;
        }
        endTests();
        return false;
    };

    return {
        startTests : startTests
    };

};

module.exports = EyeballControllersTestTest;