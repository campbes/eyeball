var YSLOW = require('yslow').YSLOW;
var jsdom = require('jsdom');

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
                obj.grade = grades.getGrades(obj.score);
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

var grades = (function() {

    var gradeMapping = {
        percentage : { A : 90,B : 80,C : 70,D : 60,E : 50, F : 0},
        points : {F : 32,E : 16,D : 8,C : 4,B : 2,A : 1},
        time : {
            lt : { F : 6000,E : 5000,D : 4000,C : 3000,B : 2000,A : 0},
            dt : { F : 5000,E : 4000,D : 3000,C : 2000,B : 1000,A : 0}
        },
        yslow : {
            o : { A : 90,B : 80,C : 70,D : 60,E : 50, F : 0},
            w : { F : 1000000,E : 750000,D : 500000,C : 250000,B : 125000,A : 0},
            r : {F : 60,E : 50,D : 40,C : 30,B : 20,A : 0},
            lt : { F : 6000,E : 5000,D : 4000,C : 3000,B : 2000,A : 0},
            g : {
                yminify : {
                    score : { A : 90,B : 80,C : 70,D : 60,E : 50, F : 0}
                }
            }
        },
        dommonster : {
            COMPOSITE_stats : { A : 90,B : 80,C : 70,D : 60,E : 50, F : 0},
            stats : {
                //serialization time
                elements : {F : 1500, E: 1125,D : 1000,C : 875,B : 750,A :0},
                nodes : {F : 2500, E: 2125,D : 2000,C : 1875,B : 1750,A :0},
                "text nodes" : {F : 1500, E: 1125,D : 1000,C : 875,B : 750,A :0},
                "text node size" : {F : 360000, E: 290000,D : 220000,C : 150000,B : 80000,A :0},
                "content percentage" : {A : 50, B: 45,C : 40,D : 35,E : 30,F :0},
                "average nesting depth" : {F : 15.5, E: 14,D : 12.5,C : 11,B : 9.5,A :0},
                "serialized DOM size" : {F : 204800, E: 179200,D : 153600,C : 128000,B : 102400,A :0}
            }
        },
        validator : {
            COMPOSITE_info : { A : 90,B : 80,C : 70,D : 60,E : 50, F : 0},
            info : {
                errors : {F : 5, E: 4,D : 3,C : 2,B : 1,A :0},
                warnings : {F : 25, E: 20,D : 15,C : 10,B : 5,A :0}
            }
        }
    };
    gradeMapping.time.lt_u = gradeMapping.time.lt;
    gradeMapping.time.dt_u = gradeMapping.time.dt;
    gradeMapping.yslow.w_c = gradeMapping.yslow.w;
    gradeMapping.yslow.r_c = gradeMapping.yslow.r;

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
                    points += gradeMapping.points[grade];
                    count += 1;
                }
            }
        }
        if (count === 0) {
            return "";
        }
        var score = points/count;
        var grades = gradeMapping.points;
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
        return buildGradeSet(rec.data,gradeMapping[rec.tool]);
    }

    function getGrade(data,type) {
        type = type || 'percentage';
        return getGradeFromData(gradeMapping[type],data);
    }

    return {
        getGradeSet : getGradeSet,
        getGrades : getGrade
    };

}());

module.exports = function() {

    var validatorFiles = [];
    var activeVnus = [];
    var maxVnus = 1;

    function getDomMonster(page,cb) {
        var dm = page.inPageTests.dommonster;

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

    return {
        testers : {
            dommonster : getDomMonster,
            yslow : runYslow,
            validator : validate
        },
        grades : grades,
        validatorFiles : validatorFiles,
        activeVnus : activeVnus
    }

};