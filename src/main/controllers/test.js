var YSLOW = require('yslow').YSLOW;
var jsdom = require('jsdom');

module.exports = function() {

    var testCfg;

    var validatorFiles = [];
    var activeVnus = [];
    var maxVnus = 1;

    var grader = (function() {

        function getGradeFromData(gradeSet,data) {
            var gr = null;

            for(gr in gradeSet) {
                if(gradeSet.hasOwnProperty(gr)) {
                    if(data >= gradeSet[gr]) {
                        return gr;
                    }
                }
            }
            return null;
        }

        function getCompositeGradeFromData(gradeSet,data) {

            if(!data) {
                return "";
            }

            var points = 0;
            var count = 0;
            var mt = null;
            var grade = null;

            for (mt in gradeSet) {
                if(gradeSet.hasOwnProperty(mt)) {
                    grade = getGradeFromData(gradeSet[mt],data[mt]);
                    if(grade) {
                        points += testCfg.grades.points[grade];
                        count += 1;
                    }
                }
            }
            if (count === 0) {
                return "";
            }
            var score = points/count;
            var grades = testCfg.grades.points;
            var gr = null;

            for(gr in grades) {
                if(grades.hasOwnProperty(gr)) {
                    if(score >= grades[gr]) {
                        return gr;
                    }
                }
            }
            return "";
        }

        function buildGradeSet(data,gradeSet) {
            var grades = {};
            var i;
            for(i in gradeSet) {
                if(gradeSet.hasOwnProperty(i)) {
                    if(i.substr(0,10) === "COMPOSITE_") {
                        grades[i] = getCompositeGradeFromData(gradeSet[i.substr(10)],data[i.substr(10)]);
                    } else if(typeof data[i] === "object") {
                        grades[i] = buildGradeSet(data[i],gradeSet[i]);
                    } else {
                        grades[i] = getGradeFromData(gradeSet[i],data[i]);
                    }
                }
            }

            return grades;
        }

        function getGradeSet(rec) {
            return buildGradeSet(rec.data,testCfg.grades[rec.tool]);
        }

        function getGrade(data,type) {
            type = type || 'percentage';
            return getGradeFromData(testCfg.grades[type],data);
        }

        return {
            getGradeSet : getGradeSet,
            getGrades : getGrade
        };

    }());

    function yslowOverrideGetResults(yscontext, info) {
        var i, l, results, url, type, comps, comp, encoded_url, obj, cr,
            cs, etag, len, include_grade, include_comps, include_stats,
            result, len2, spaceid,
            reButton = / <button [\s\S]+<\/button>/,
            isArray = YSLOW.util.isArray,
            stats = {},
            stats_c = {},
            comp_objs = [],
            params = {},
            g = {};

        // default
        info = (info || 'basic').split(',');

        for (i = 0, len = info.length; i < len; i += 1) {
            if (info[i] === 'all') {
                include_grade = include_stats = include_comps = true;
                break;
            }
            switch (info[i]) {
                case 'grade':
                    include_grade = true;
                    break;
                case 'stats':
                    include_stats = true;
                    break;
                case 'comps':
                    include_comps = true;
                    break;
            }
        }

        params.w = parseInt(yscontext.PAGE.totalSize, 10);
        params.o = parseInt(yscontext.PAGE.overallScore, 10);
        params.u = encodeURIComponent(yscontext.result_set.url);
        params.r = parseInt(yscontext.PAGE.totalRequests, 10);
        spaceid = YSLOW.util.getPageSpaceid(yscontext.component_set);
        if (spaceid) {
            params.s = encodeURI(spaceid);
        }
        params.i = yscontext.result_set.getRulesetApplied().id;

        if (yscontext.PAGE.t_done) {
            params.lt = parseInt(yscontext.PAGE.t_done, 10);
        }

        if (include_grade) {
            results = yscontext.result_set.getResults();

            for (i = 0, len = results.length; i < len; i += 1) {
                obj = {};
                result = results[i];
                if (result.hasOwnProperty('score')) {
                    if (result.score >= 0) {
                        obj.score = parseInt(result.score, 10);
                    } else if (result.score === -1) {
                        obj.score = 'n/a';
                    }

                    // JAMTROUSERS - set grades on individual items
                    obj.grade = grader.getGrades(obj.score);
                }
                comps = result.components;
                if (isArray(comps)) {
                    obj.components = [];
                    for (l = 0, len2 = comps.length; l < len2; l += 1) {
                        comp = comps[l];
                        if (typeof comp === 'string') {
                            url = comp;
                        } else if (typeof comp.url === 'string') {
                            url = comp.url;
                        }
                        if (url) {
                            url = encodeURIComponent(url.replace(reButton, ''));
                            obj.components.push(url);
                        }
                    }
                }

                // JAMTROUSERS : add messages
                if (result.hasOwnProperty('message')) {
                    obj.message = result.message;
                }

                g[result.rule_id] = obj;
            }
            params.g = g;
        }

        if (include_stats) {
            params.w_c = parseInt(yscontext.PAGE.totalSizePrimed, 10);
            params.r_c = parseInt(yscontext.PAGE.totalRequestsPrimed, 10);

            for (type in yscontext.PAGE.totalObjCount) {
                if (yscontext.PAGE.totalObjCount.hasOwnProperty(type)) {
                    stats[type] = {
                        'r': yscontext.PAGE.totalObjCount[type],
                        'w': yscontext.PAGE.totalObjSize[type]
                    };
                }
            }
            params.stats = stats;

            for (type in yscontext.PAGE.totalObjCountPrimed) {
                if (yscontext.PAGE.totalObjCountPrimed.hasOwnProperty(type)) {
                    stats_c[type] = {
                        'r': yscontext.PAGE.totalObjCountPrimed[type],
                        'w': yscontext.PAGE.totalObjSizePrimed[type]
                    };
                }
            }
            params.stats_c = stats_c;
        }

        if (include_comps) {
            comps = yscontext.component_set.components;
            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                encoded_url = encodeURIComponent(comp.url);
                obj = {
                    'type': comp.type,
                    'url': encoded_url,
                    'size': comp.size,
                    'resp': comp.respTime
                };
                if (comp.size_compressed) {
                    obj.gzip = comp.size_compressed;
                }
                if (comp.expires && comp.expires instanceof Date) {
                    obj.expires = YSLOW.util.prettyExpiresDate(comp.expires);
                }
                cr = comp.getReceivedCookieSize();
                if (cr > 0) {
                    obj.cr = cr;
                }
                cs = comp.getSetCookieSize();
                if (cs > 0) {
                    obj.cs = cs;
                }
                etag = comp.getEtag();
                if (typeof etag === 'string' && etag.length > 0) {
                    obj.etag = etag;
                }
                comp_objs.push(obj);
            }
            params.comps = comp_objs;
        }

        return params;
    }

    function getDomMonster(page,cb) {
        var dm = page.EYEBALLTEST.dommonster;

        var i;
        for(i in dm.stats) {
            if(dm.stats.hasOwnProperty(i)) {
                // make string values numbers by removing units
                if(typeof dm.stats[i] === "string") {
                    dm.stats[i] = dm.stats[i].replace(/[A-z]|%/g,'');
                }
            }
        }
        cb(dm);
    }

    function runYslow(har,cb) {
        cb(yslowOverrideGetResults(YSLOW.harImporter.run(jsdom.jsdom(), har, 'ydefault').context, 'grade,stats'));
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
        console.log("Active VNUs: "+activeVnus[0]);

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
                }
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

    }

    function validate(data,cb) {
        var htmlFile = (new Date()).getTime().toString() + (Math.random()*10).toString() + '.html';
        var fs = require("fs");
        fs.writeFile(htmlFile,data,function(error){
            if(error) {
                eyeball.logger.info(error);
            }
            validatorFiles.push({file:htmlFile,cb : cb});
            runValidator();
        });
    }

    var testers = {
        dommonster : getDomMonster,
        yslow : runYslow,
        validator : validate
    };

    testCfg = require('../conf/test')(testers);

    return {
        tests : testCfg.tests,
        grades : grader,
        validatorFiles : validatorFiles,
        activeVnus : activeVnus
    };

};