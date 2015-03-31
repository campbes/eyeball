/*global window, document*/

var EyeballControllersTestTest = function(params) {

    var Q = require('q');

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
        ph.exit();
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
        this.timestamp = new Date();
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
                setTimeout(function() {
                    testObj.page.evaluate(Webpage.getTestData, processInPageTest);
                },500);
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
        Q.all(test.page.received.concat([test.page.finished.promise])).then(function() {
            //clearInterval(test.renderInterval);
            runInPageTests(test, function () {
                completePage(test, ph);
            });
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

        test.page.set('viewportSize',{
            width: 1280,
            height: 1024
        });
        test.page.set('clipRect',{
            top: 0,
            left: 0,
            width: 1280,
            height: 1024
        });
        test.page.set('customHeaders',{
            "x-eyeball-pass" : test.passes.length,
            "x-eyeball-timestamp" : test.timestamp
        });

        test.start = new Date();
        var screenshots = 0;
        /*test.renderInterval = setInterval(function() {
            test.page.render(test.passes.length+'-'+(screenshots++)+'.jpg');
            if (screenshots > 100) {
                clearInterval(test.renderInterval);
            }
        },100);*/
        test.page.open(test.pageUrl,function(err,status) {
            buildWebpage(err,status,test,ph);
        });
    }

    function createPage(test,ph) {
        ph.createPage(function(page,err) {
            testPage(page,err,test,ph);
        });
    }

    function openPage(ph) {
        eyeball.logger.info("Opening page with "+ph.process.pid);
        if(urls.length === 0 ) {
            ph.exit();
            return;
        }
        var test = new Test();
        test.pageUrl = urls.splice(0,1)[0];
        activeTests[ph.process.pid] = test.pageUrl;
        createPage(test,ph);
    }

    var startTests;

    completePage = function(test,ph) {
        test.page.close(function(){
            test.passes[test.passes.length] = test.webpage;
            if(test.passes.length === 1) {
                createPage(test,ph);
                return;
            }
            Record.create(test.passes);
            delete activeTests[ph.process.pid];
            ph.exit();
            startTests();
        });
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

    function testsAreActive() {
        var test;
        for(test in activeTests) {
            if(activeTests.hasOwnProperty(test)) {
                return true;
            }
        }
        return false;
    }

    function createPhantom(ph) {
        openPage(ph);
        setTimeout(startTests,3000);
    }

    function phantomExit(pid,arg) {
        if(activeTests[pid]) {
            erroredUrls.push(activeTests[pid]);
            delete activeTests[pid];
        }
        startTests();
    }

    endTests = function() {
        if(!retriedErrors && erroredUrls.length > 0) {
            // give the failures one more go
            eyeball.logger.info("Retrying errored urls...");
            urls = [].concat(erroredUrls);
            setTimeout(closeTests,erroredUrls.length*60000);
            erroredUrls = [];
            retriedErrors = true;
            Phantom.request(createPhantom,phantomExit);
            return;
        }
        if(!testsAreActive()) {
            closeTests();
        }
    };

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