var EyeballControllersTestRecord = function(build,tag,urlsLength) {

    var testers = require('./testers');
    var grader = require('./grader');
    var har = require('./har');
    var testCfg = require('../../conf/test');
    var fs = require("fs");

    var committedRecords = [];
    var createdRecords = [];
    var uncommittedRecords = [];

    function commitRecord(record){

        clearTimeout(record.recordTimer);
        delete record.recordTimer;

        record = testers.eyeball(record);

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

        if(record.markupTestFile) {
            fs.unlink(record.markupTestFile,function(err){
                if(err) {
                    console.log("error deleting validator file: "+err);
                }
                eyeball.logger.info("Deleting validator file");
            });
        }

    }

    function updateRecord(record,property,data) {
        if(property === 'codequality') {console.log(data);}
        var metric = {
            url : record.url,
            timestamp: new Date(),
            build : build,
            tag : tag,
            tool : property,
            data : data
        };

        metric.grades = grader.getGradeSet(metric);
        record.metrics[property] = metric;

        var i, test;

        var tests = [].concat(testCfg.tests.browser).concat(testCfg.tests.har).concat(testCfg.tests.markup);

        for(i=0; i<tests.length; i++) {
            test = tests[i];
            if(!record.metrics[test.name]) {
                eyeball.logger.info("No entry for " + test.name);
                return;
            }
        }

        if(record.recordTimer) {
            commitRecord(record);
        }

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
            var extractor;
            for(i=0; i<testSet.length; i++) {
                test = testSet[i];
                extractor = testers[test.name];
                if(typeof extractor !== "function") {
                    extractor = test.extractor;
                }
                extractor(data,cbMaker(test.name));
                eyeball.logger.info('got '+test.name+' result');
            }
        }

        har.create(passes[0],function(har1) {
            harUncached = har1;
            har.create(passes[1],function(har2) {
                harCached = har.combine([har1,har2]);
                eyeball.logger.info("created har");
                updateRecord(record,'har',harCached);
                updateRecord(record,'harUncached',harUncached);
                updateRecord(record,'time',{
                    lt : harCached.log.pages[0].pageTimings.onLoad,
                    dt :  harCached.log.pages[0].pageTimings.onContentLoad,
                    lt_u : harUncached.log.pages[0].pageTimings.onLoad,
                    dt_u :  harUncached.log.pages[0].pageTimings.onContentLoad
                });
                runTestSet(testCfg.tests.har,harUncached);
            });
        });


        runTestSet(testCfg.tests.browser,passes[1]);

        record.markupTestFile = (new Date()).getTime().toString() + (Math.random()*10).toString() + '.html';

        fs.writeFile(record.markupTestFile,passes[1].content,function(error){
            if(error) {
                eyeball.logger.info(error);
            }
            runTestSet(testCfg.tests.markup,record.markupTestFile);
        });

    }

    return {
        create : createRecord,
        update : updateRecord,
        commit : commitRecord,
        committedRecords : committedRecords
    };

};

module.exports = EyeballControllersTestRecord;