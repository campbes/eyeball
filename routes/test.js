var request = require('request');

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
        for(var i in gradeSet) {
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

module.exports = function(req,res) {

    var build = req.body.build;
    var datafile = req.body.datafile;
    var url = req.body.url;
    var reps = req.body.reps;
    var tag = req.body.tag || '';
    var regex = req.body.regex;
    var regexReplace = req.body.regexReplace;

    var urls = null;
    var urlsLength = 0;
    var committedRecords = 0;

    var YSLOW = require('yslow').YSLOW;
    var jsdom = require('jsdom');
    var phantom = require('node-phantom');
    var fs = require('fs');
    var exec = require('child_process').exec;

    var tests = {
        har : true,
        yslow : true, // requires har
        time : true, //requires yslow
        dommonster : true,
        validator : true
    };

    function commitRecord(record){

        clearTimeout(record.recordTimer);
        delete record.recordTimer;

        DB.insert(record,function(err){
            if(err) {
                console.log(err);
            }
            committedRecords = committedRecords + 1;
            console.log("Emitting...");
            eyeball.io.sockets.emit('commitRecord_'+build,{
                committed : committedRecords,
                total : urlsLength,
                progress : Math.floor((committedRecords/urlsLength) * 100),
                record : record
            });
        });
    }

    function updateRecord(record,property,data) {

        var metric = {
            url : record.url,
            timestamp: new Date(),
            build : build,
            tag : tag,
            tool : property,
            data : data
        };

        metric.grades = grades.getGradeSet(metric);
        record.metrics[property] = metric;

        for(var i in tests) {
            if(tests.hasOwnProperty(i) && tests[i] === true) {
                if(!record.metrics[i]) {
                    console.log("No entry for " + i);
                    return;
                }
            }
        }

        if(record.recordTimer) {
            commitRecord(record);
        }

    }

    function getDomMonster(page) {
        var dm = page.dommonster;
        if(!dm) {
            return {};
        }
        for(var i in dm.stats) {
            if(dm.stats.hasOwnProperty(i)) {
                // make string values numbers by removing units
                if(typeof dm.stats[i] === "string") {
                    dm.stats[i] = dm.stats[i].replace(/[A-z]|%/g,'');
                }
            }
        }
        return dm;
    }

    function createHAR(page,callback) {
        var entries = [];

        page.resources.forEach(function (resource) {
            var request = resource.request,
                startReply = resource.startReply,
                endReply = resource.endReply;

            if (!request || !startReply || !endReply) {
                return;
            }

            // Exclude Data URI from HAR file because
            // they aren't included in specification
            if (request.url.match(/(^data:image\/.*)/i)) {
                return;
            }

            var time = new Date(endReply.time).getTime() - new Date(request.time).getTime();

            entries.push({
                startedDateTime: request.time,
                time: time,
                request: {
                    method: request.method,
                    url: request.url,
                    httpVersion: "HTTP/1.1",
                    cookies: [],
                    headers: request.headers,
                    queryString: [],
                    headersSize: -1,
                    bodySize: -1
                },
                response: {
                    status: endReply.status,
                    statusText: endReply.statusText,
                    httpVersion: "HTTP/1.1",
                    cookies: [],
                    headers: endReply.headers,
                    redirectURL: "",
                    headersSize: -1,
                    bodySize: startReply.bodySize,
                    content: {
                        size: startReply.bodySize,
                        mimeType: endReply.contentType
                    }
                },
                cache: {},
                timings: {
                    blocked: 0,
                    dns: -1,
                    connect: -1,
                    send: 0,
                    wait: new Date(startReply.time).getTime() - new Date(request.time).getTime(),
                    receive: new Date(endReply.time).getTime() - new Date(startReply.time).getTime(),
                    ssl: -1
                },
                pageref: page.address
            });
        });

       callback({
            log: {
                version: '1.2',
                creator: {
                    name: "PhantomJS",
                    version : "1.9.2"
                },
                pages: [{
                    startedDateTime: page.startTime.toISOString(),
                    id: page.address,
                    title: page.title,
                    pageTimings: {
                        onLoad: page.endTime - page.startTime,
                        onContentLoad : page.onContentLoad - page.startTime
                    }
                }],
                entries: entries
            }
        });
    }

    function combineHARs(hars) {

        var har = hars[0];
        var cachedHar = hars[1];

        function matchEntry(url) {
            for(var i=cachedHar.log.entries.length-1; i>=0; i--) {
                if(cachedHar.log.entries[i].request.url === url) {
                    return cachedHar.log.entries[i];
                }
            }
            return false;
        }

        cachedHar.log.creator = {
            name : "Eyeball",
            version : "0.0.0"
        };

        for (var i=0; i<har.log.entries.length; i++) {
            var matched = matchEntry(har.log.entries[i].request.url);
            if(!matched) {
                var entry = {
                    startedDateTime: cachedHar.log.pages[0].startedDateTime,
                    time: 0,
                    request: {
                        method: har.log.entries[i].request.method,
                        url: har.log.entries[i].request.url,
                        httpVersion: "HTTP/1.1",
                        cookies: [],
                        headers: har.log.entries[i].request.headers,
                        queryString: [],
                        headersSize: -1,
                        bodySize: -1
                    },
                    response: {
                        status: '(cache)',
                        statusText: '(cache)',
                        httpVersion: "HTTP/1.1",
                        cookies: [],
                        headers: har.log.entries[i].response.headers,
                        redirectURL: "",
                        headersSize: -1,
                        bodySize: 0,
                        content: {
                            size: har.log.entries[i].response.bodySize,
                            mimeType: har.log.entries[i].response.content.mimeType
                        }
                    },
                    cache: {
                        afterRequest : har.log.entries[i].response.bodySize
                    },
                    timings: {
                        blocked: 0,
                        dns: 0,
                        connect: 0,
                        send: 0,
                        wait: 0,
                        receive: 0,
                        ssl: -1
                    },
                    pageref: har.log.entries[i].pageref
                };

                cachedHar.log.entries.push(entry);
            }
        }

        return cachedHar;
    }

    function validate(data,callback) {
        var htmlFile = (new Date()).getTime().toString() + (Math.random()*10).toString() + '.html';
        fs.writeFile(htmlFile,data,function(error){
            if(error) {
                console.log(error);
            }
            var vnu = exec('java -jar -Dnu.validator.client.out=json C:/vnu-fast-client.jar validate.html',
                function(err,stdout,stderr) {
                    if(err && !stdout) {
                        console.log("VNU client error: "+err);
                        console.log("VNU client error: "+err.code);
                    }
                    if(stderr) {
                        console.log("VNU client error: "+stderr);
                    }

                    console.log("got validator data");
                    var errors = 0;
                    var warnings = 0;
                    var val = JSON.parse(stdout);
                    vnu.kill();
                    fs.unlink(htmlFile,function(){
                        console.log("Deleting validator file");
                    });

                    for (var i=val.messages.length-1; i>=0; i--) {
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
                }
            );
        });
    }

    function createRecord(passes) {

        var record = {
            url : passes[1].address,
            timestamp: new Date(),
            build : build,
            tag : tag,
            metrics : {}
        };

        record.recordTimer = setTimeout(function(){
            console.log("Gave up waiting for metrics");
            commitRecord(record);
        },(tests.validator ? 30000 : 10000));

        var harUncached = null;
        var harCached = null;

        if(tests.har) {
            createHAR(passes[0],function(har1) {
                harUncached = har1;
                createHAR(passes[1],function(har2) {
                    harCached = combineHARs([har1,har2]);
                    console.log("created har");
                    updateRecord(record,'har',harCached);
                    updateRecord(record,'harUncached',harUncached);
                    updateRecord(record,'time',{
                        lt : harCached.log.pages[0].pageTimings.onLoad,
                        dt :  harCached.log.pages[0].pageTimings.onContentLoad,
                        lt_u : harUncached.log.pages[0].pageTimings.onLoad,
                        dt_u :  harUncached.log.pages[0].pageTimings.onContentLoad
                    });
                    if(tests.yslow) {
                        var yslow = yslowOverrideGetResults(YSLOW.harImporter.run(jsdom.jsdom(), harCached, 'ydefault').context, 'grade,stats');
                        console.log('got yslow result');
                        updateRecord(record,'yslow',yslow);
                    }
                });
            });
        }

        if(tests.dommonster) {
            var dm = getDomMonster(passes[1]);
            console.log('got dommonster result');
            updateRecord(record,'dommonster',dm);
        }

        if(tests.validator) {
            validate(passes[1].content,function(val){
                updateRecord(record,'validator',val);
            });
        }
    }

    function setupPage(page) {
        page.resources = [];
        page.libraryPath = "../";
        page.settings = {
            resourceTimeout : 5
        };

        page.onConsoleMessage = function (msg) {
            //console.log(msg);
        };

        /*page.onLoadStarted = function () {
            page.startTime = new Date();
        };*/

        page.onResourceRequested = function (req) {
            page.resources[req[0].id] = {
                request: req[0],
                startReply: null,
                endReply: null
            };
        };

        page.onResourceReceived = function (res) {
            if(!page.resources[res.id]) {
                return;
            }
            if (res.stage === 'start') {
                page.resources[res.id].startReply = res;
            }
            if (res.stage === 'end') {
                page.resources[res.id].endReply = res;
            }
        };

        page.setFn('onCallback',function(msg) {
            if(msg === "DOMContentLoaded") {
                page.evaluate(function(){
                    window.DOMContentLoaded = new Date().getTime();
                })
            }
        });

        page.setFn('onInitialized',function(){
            console.log("Page Initialized...");
            page.evaluate(function() {
                document.addEventListener('DOMContentLoaded', function() {
                    window.callPhantom('DOMContentLoaded');
                }, false);
            });
        });

        return page;
    }

    function openPage(ph) {

        console.log("Opening page with "+ph._phantom.pid);

        var passes = [];

        function createPage(pass,url) {
            ph.createPage(function(err,page) {
                if(err) {
                    console.log(err);
                }

                page = setupPage(page);

                if(pass === 0){
                    url = urls[0];
                    urls.splice(0,1);
                }

                var webpage = {};

                webpage.address = url;
                webpage.startTime = new Date();
                page.open(webpage.address, function (err,status) {
                    if(err) {
                        console.log(err);
                    }
                    if (status !== 'success') {
                        console.log('FAIL to load the address');
                        ph.exit(1);
                    } else {
                        webpage.endTime = new Date();
                        page.injectJs("dommonster.js");
                        setTimeout(function(){
                            page.evaluate(function () {
                                return {
                                    title : document.title,
                                    content : document.documentElement.outerHTML,
                                    onContentLoad : window.DOMContentLoaded,
                                    dommonster : window.DM
                                };
                            },function(err,doc){
                                webpage.title = doc.title;
                                webpage.content = doc.content;
                                webpage.onContentLoad = new Date(doc.onContentLoad);
                                webpage.resources = [].concat(page.resources);
                                webpage.dommonster = doc.dommonster;
                                page.close();
                                passes[pass] = webpage;

                                if(pass === 0) {
                                    createPage(1,url);
                                } else if(pass === 1) {
                                    createRecord(passes);
                                    if(urls.length > 0) {
                                        openPage(ph);
                                    } else {
                                        ph.exit();
                                    }
                                }
                            });
                        },1000);
                    }
                });
            });
        }

        createPage(0);
    }

    var phantomMax = 5;
    var activePhantoms = 0;

    function startPhantom() {

        if(activePhantoms >= phantomMax) {
            return;
        }

        phantom.create(function(err,ph) {
            if(err) {
                console.log(err);
            }
            ph.onError = function(err,trace) {
                console.log("Phantom error: "+err);
                ph.exit(1);
                if(urls.length > 0) {
                    startPhantom();
                }
            };
            ph.on("error",function(err,trace) {
                console.log("Phantom error: "+err);
                ph.exit(1);
                if(urls.length > 0) {
                    startPhantom();
                }
            });
            ph.on("exit",function(msg) {
                console.log("Phantom Exit: "+ph._phantom.pid+ "("+msg+")");
                activePhantoms = activePhantoms - 1;
                if(urls.length > 0) {
                    startPhantom();
                }
            });
            openPage(ph);
            activePhantoms = activePhantoms + 1;
            console.log("Active Phantoms: "+activePhantoms);
            if(urls.length > 0) {
                startPhantom();
            }
        }, {
            phantomPath : 'C:/phantomjs-1.9.2-windows/phantomjs-1.9.2-windows/phantomjs'
        });
    }


    function go(data) {

        if(regex) {
            regexReplace = regexReplace || "";
            data = data.replace(new RegExp(regex,"g"),regexReplace);

        }

        urls = data.split("\r\n");
        if(reps) {
            var urlset = urls;
            for(var i=0; i<reps; i++) {
                urls = urls.concat(urlset);
            }
        }

        urlsLength = urls.length;

        if(urlsLength < phantomMax) {
            phantomMax = urlsLength;
        }

        startPhantom();

    }

    if (url) {
        go(url);
    } else if(datafile.indexOf("http") > -1) {
        var http = require('http');
        var fileData = "";
        http.get(datafile,function(res) {
            res.on("data",function(data) {
                fileData += data.toString();
            });
            res.on("end",function() {
                go(fileData);
            });
        });
    } else if (datafile) {
        var fs = require("fs");
        fs.readFile(datafile,'utf8',function(err,data) {
            go(data)
        });
    }

    res.send("OK");
};


function yslowOverrideGetResults(yscontext, info) {
    var i, l, results, url, type, comps, comp, encoded_url, obj, cr,
        cs, etag, name, len, include_grade, include_comps, include_stats,
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
        } else {
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