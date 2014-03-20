var testControllerTesters = function() {

    var YSLOW = require('yslow').YSLOW;
    var jsdom = require('jsdom');

    var testCfg = require('../../conf/test');
    var grader = require('./grader');
    var yslowOverride = require("./yslowOverride");

    var validatorFiles = [];
    var activeVnus = [];
    var maxVnus = 1;

    function getDomMonster(page,cb) {
        var dm = page.EYEBALLTEST.dommonster;

        var i;
        for(i in dm.stats) {
            if(dm.stats.hasOwnProperty(i) && typeof dm.stats[i] === "string") {
                // make string values numbers by removing units
                dm.stats[i] = dm.stats[i].replace(/[A-z]|%|\s/g,'');
            }
        }
        cb(dm);
        return dm;
    }

    function runYslow(har,cb) {
        return cb(yslowOverride.yslowOverrideGetResults(YSLOW.harImporter.run(jsdom.jsdom(), har, 'ydefault').context, 'grade,stats'));
    }


    function runValidator() {

        if(activeVnus.length === maxVnus || validatorFiles.length === 0) {
            return;
        }

        var item = validatorFiles.splice(0,1)[0];

        var htmlFile = item.file;
        var callback = item.cb;
        var vnuData = "";
        var vnu = require('child_process').spawn('java',['-jar','-Dnu.validator.client.out=json','-Dfile.encoding=UTF8','lib/vnu-fast-client.jar',htmlFile]);
        activeVnus.push(vnu);

        setTimeout(function(){
            vnu.kill();
        },5000);

        vnu.stdout.on('data',function(data) {
            vnuData += data;
        });

        vnu.stdout.on('end',function(code) {
            var errors = 0;
            var warnings = 0;
            var val;

            try {
                val = JSON.parse(vnuData);
            } catch (e) {
                eyeball.logger.error("Invalid VNU response: "+e);
                return;
            }
            var i = 0;
            for (i=val.messages.length-1; i>=0; i--) {
                if(val.messages[i].type === "error") {
                    errors += 1;
                } else
                if(val.messages[i].subType === "warning") {
                    warnings += 1;
                }
            }
            val.info = {
                errors : errors,
                warnings : warnings
            };

            callback(val);

        });

        vnu.stderr.on('data', function (err) {
            eyeball.logger.error('vnu client error: ' + err);
        });

        vnu.on('close', function (code) {
            var fs = require("fs");
            eyeball.logger.info('vnu child process closed ' + code);
            fs.unlink(htmlFile,function(err){
                if(err) {
                    console.log("error deleting validator file: "+err);
                }
                eyeball.logger.info("Deleting validator file");
            });
            var i = 0;
            for(i=activeVnus.length-1; i>=0; i--) {
                if(activeVnus[i] === vnu) {
                    activeVnus.splice(i,1);
                }
            }

            if(validatorFiles.length > 0) {
                runValidator();
            }

        });

        return item;

    }

    function validate(data,cb) {
        var htmlFile = (new Date()).getTime().toString() + (Math.random()*10).toString() + '.html';
        var fs = require("fs");

        var item = {file:htmlFile,cb : cb};
        validatorFiles.push(item);

        fs.writeFile(htmlFile,data,function(error){
            if(error) {
                eyeball.logger.info(error);
            }
            runValidator();
        });

        return item;

    }

    function addEyeballMetrics(record) {
        record.metrics.eyeball = {
            url : record.url,
            timestamp: new Date(),
            build : record.build,
            tag : record.tag,
            data : {},
            grades : {},
            tool : 'eyeball'
        };

        var eyeballScore = 0, score, eyeballMetrics, metrics, metric, grade, eyeballGrade;

        for(score in testCfg.eyeballScoring) {
            if(testCfg.eyeballScoring.hasOwnProperty(score)) {
                eyeballScore = 0;
                metrics = 0;
                eyeballMetrics = testCfg.eyeballScoring[score].metrics;
                for(metric in eyeballMetrics) {
                    if(eyeballMetrics.hasOwnProperty(metric) && record.metrics.hasOwnProperty(metric)) {
                        grade = record.metrics[metric].grades[eyeballMetrics[metric].metric];
                        if(grader.getValue(grade,'points')) {
                            eyeballScore += grader.getValue(grade,'points');
                            metrics += eyeballMetrics[metric].influence;
                        }
                    }
                }

                eyeballScore = Math.floor(eyeballScore/metrics);
                eyeballGrade = grader.getGrades(eyeballScore,'points');
                record.metrics.eyeball.data[score] = eyeballScore;
                record.metrics.eyeball.grades[score] = eyeballGrade;
            }

        }
        return record;
    }

    var internal = {
        validatorFiles : validatorFiles,
        activeVnus : activeVnus,
        runValidator : runValidator
    };

    return {
        eyeball : addEyeballMetrics,
        dommonster : getDomMonster,
        yslow : runYslow,
        validator : validate,
        internal : internal
    };

};

module.exports = testControllerTesters();