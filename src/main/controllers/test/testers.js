var EyeballControllersTestTesters = function() {

    var YSLOW = require('yslow').YSLOW;
    var jsdom = require('jsdom');

    var testCfg = require('../../conf/test');
    var grader = require('./grader');
    var yslowOverride = require("./yslowOverride");
    var validator = require("./validator");

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

    function runValidator(data,cb) {
        validator.validate(data,cb);
    }

    function aria(file,cb) {
        var AriaLinter = require('arialinter');

        AriaLinter.initialize(file, function() {
            AriaLinter.evaluate();
            var warnings = 0;
            var errors = 0;
            var val = AriaLinter.getReport('json');
            val = val.replace(/<(.*?)>/g, function(v) {
                return v.replace(/"/g,'\\"');
            });
            val = val.replace(/<script>(.*?)>/g, function(v) {
                return v.replace(/"/g,'\\"');
            });
            val = JSON.parse(val);

            var i = 0;
            for (i=val.errors.length-1; i>=0; i--) {
                if(val.errors[i].type === "Error") {
                    errors += 1;
                } else if(val.errors[i].type === "Info") {
                    warnings += 1;
                }
            }
            val.info = {
                errors : errors,
                warnings : warnings
            };
            cb(val);
        });
    }

    return {
        eyeball : addEyeballMetrics,
        dommonster : getDomMonster,
        yslow : runYslow,
        validator : runValidator,
        aria : aria
    };

};

module.exports = EyeballControllersTestTesters();