var testController = function(params) {

    params = params || {};

    var testCfg = require('../../conf/test');
    var grader = require('./grader');
    var har = require('./har');
    var page = require('./page');
    var record = require('./record')(
        params.build,
        params.tag,
        params.urlsLength
    );
    var testers = require('./testers');

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
        runInPageTest(webpage,page,[].concat(testCfg.tests.browser),callback);
    }

    return {
        tests : testCfg.tests,
        grades : grader,
        runInPageTests : runInPageTests,
        har : har,
        page : page,
        record : record,
        testers : testers
    };

};

module.exports = testController;