var request = require('request');

function accessObject(obj,str) {

    function getProp(obj,key) {
        return obj[key];
    }

    var keys = str.split(".");
    var keysLength = keys.length;
    var i = null;

    for (i=0; i<keysLength; i++) {
        if(!obj) {
            return null;
        }
        obj = getProp(obj,keys[i]);
    }
    return obj;
}

var grades = (function() {

    var gradeMapping = {
        percentage : { A : 90,B : 80,C : 70,D : 60,E : 50, F : 0},
        points : {F : 32,E : 16,D : 8,C : 4,B : 2,A : 1},
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
                elements : {F : 1500, E: 1125,D : 1000,C : 875,B : 750,A :0},
                nodecount : {F : 2500, E: 2125,D : 2000,C : 1875,B : 1750,A :0},
                textnodes : {F : 1500, E: 1125,D : 1000,C : 875,B : 750,A :0},
                textnodessize : {F : 360000, E: 290000,D : 220000,C : 150000,B : 80000,A :0},
                contentpercent : {A : 50, B: 45,C : 40,D : 35,E : 30,F :0},
                average : {F : 15.5, E: 14,D : 12.5,C : 11,B : 9.5,A :0},
                domsize : {F : 204800, E: 179200,D : 153600,C : 128000,B : 102400,A :0}
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

var totals = (function() {

    function getPC(results,tool,measure) {
        var fails = 0;
        var count = 0;
        var i = null;
        var res = null;
        var grade = null;

        for (i=results.length-1; i>=0; i--) {
            if(!results[i].metrics) {
                continue;
            }
            res = results[i].metrics[tool];
            if(!res || !res.grades) {
                continue;
            }

            grade = util.accessObject(res.grades,measure);

            if(!grade) {
                continue;
            }
            count += 1;
            if(grade !== "A" && grade !== "B") {
                fails +=1;
            }
        }
        return Math.floor(100 - (fails/(count/100)));
    }

    function getTotal(results,tool,measure) {

        var pc = getPC(results,tool,measure);
        var total = {
            score : pc,
            grade : ""
        };

        if(pc > 85) {
            total.grade = "PASS";
        } else if (pc <= 85) {
            total.grade = "FAIL";
        }
        return total;
    }

    return {
        getTotal : getTotal
    };

}());


module.exports = function(req,res) {

    var build = req.body.build;
    var datafile = req.body.datafile;
    var url = req.body.url;
    var reps = req.body.reps;
    var tag = req.body.tag || '';
    var environment = tweakEnvironment(req.body.env);

    var urls = null;
    var urlsLength = 0;
    var committedRecords = 0;

    function tweakEnvironment(str) {
        if(!str) {
            return '';
        }
        if(str.match(/^d[0-9]{2,3}(edi|del)/)) {
            return str + ".dev."
        }
        if(str.match(/^c[0-9]{2,3}(edi|del)/)) {
            return str + ".cls."
        }
        if(str.match(/^(p|l)[0-3]{2,3}(edi|del)/)) {
            return str + "."
        }
        return str;
    }

    var YSLOW = require('yslow').YSLOW;
    var jsdom = require('jsdom');

    var phantom = require('node-phantom');

    var tests = {
        har : true,
        yslow : true, // requires har
        dommonster : true,
        validator : false
    };

    function commitRecord(record){
        clearTimeout(record.recordTimer);
        delete record.recordTimer;
        DB.insert(record,function(err,msg){
            if(err) {
                console.log(err);
            }
            if(msg) {
                console.log(msg);
            }
            committedRecords++;
            console.log("Emitting...");
            eyeball.io.sockets.emit('commitRecord_'+build,{
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

    function getDomMonster(page,callback) {
        jsdom.env(page.content,['../dommonster.js?'+new Date()],function(err,window){
            setTimeout(function(){
                callback(window.DM);
                window.close();
            },1000);
        });
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

            var time = new Date(endReply.time) - new Date(request.time);

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
                    wait: new Date(startReply.time) - new Date(request.time),
                    receive: new Date(endReply.time) - new Date(startReply.time),
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
                        onLoad: page.endTime - page.startTime
                    }
                }],
                entries: entries
            }
        });
    }

    function createRecord(page) {

        var record = {
            url : page.address,
            timestamp: new Date(),
            build : build,
            tag : tag,
            metrics : {}
        };

        record.recordTimer = setTimeout(function(){
            console.log("Gave up waiting for metrics");
            commitRecord(record);
        },10000);

        if(tests.har) {
            createHAR(page,function(har){
                console.log("created har");
                updateRecord(record,'har',har);

                if(tests.yslow) {
                    var yslow = YSLOW.util.getResults(YSLOW.harImporter.run(jsdom.jsdom(), har, 'ydefault').context, 'grade,stats');

                    for(var i in yslow.g) {
                        if(yslow.g.hasOwnProperty(i)) {
                            yslow.g[i].grade = grades.getGrades(yslow.g[i].score);
                            yslow.g[i].rule = YSLOW.doc.rules[i].name;
                        }
                    }

                    console.log('got yslow result');
                    updateRecord(record,'yslow',yslow);
                }

            });
        }

        if(tests.dommonster) {
            getDomMonster(page,function(dm){
                console.log('got dommonster result');
                updateRecord(record,'dommonster',dm);
            });
        }

        function validate(html) {
            var requestW3c = request.defaults({'proxy':'http://cache2.practicallaw.com:8080'});
            requestW3c.post({
                url : 'http://validator.w3.org/check',
                form:{
                    fragment : html,
                    output : 'json'
                },
                headers : {
                    'User-Agent': 'Eyeball'
                }
            },function(err,response,body) {
                if (!err && response.statusCode == 200) {
                    console.log("got validator data");
                    updateRecord(record,'validator',body);
                }
            });
        }

        if(tests.validate) {
            validate(page.content);
        }
    }


    function openPage(ph) {

        function setupPage(page) {
            page.resources = [];

            page.onConsoleMessage = function (msg) {
                //console.log(msg);
            };

            page.onLoadStarted = function () {
                page.startTime = new Date();
            };

            page.onResourceRequested = function (req) {
                page.resources[req[0].id] = {
                    request: req[0],
                    startReply: null,
                    endReply: null
                };
            };

            page.onResourceReceived = function (res) {
                if (res.stage === 'start') {
                    page.resources[res.id].startReply = res;
                }
                if (res.stage === 'end') {
                    page.resources[res.id].endReply = res;
                }
            };

            return page;
        }

        ph.createPage(function(err,page) {
            if(err) {
                console.log(err);
            }

            var url = urls[0];
            urls.splice(0,1);

            page = setupPage(page);
            page.address = url;

            page.open(page.address, function (err,status) {

                if(err) {
                    console.log(err);
                }

                if (status !== 'success') {
                    console.log('FAIL to load the address');
                    ph.exit(1);
                } else {
                    page.endTime = new Date();
                    page.evaluate(function () {
                        return {
                            title : document.title,
                            content : document.documentElement.outerHTML
                        };
                    },function(err,doc){
                        page.title = doc.title;
                        page.content = doc.content;
                        page.close();

                        createRecord(page);

                        if(urls.length > 0) {
                            openPage(ph);
                        } else {
                            ph.exit();
                            res.send("OK");
                        }

                    });
                }
            });

        });

    }

    var phantomMax = 10;

    function go(data) {

        data = data.replace(/@ENV@/g,environment);
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

        for (var i=1; i<=phantomMax; i++) {
            phantom.create(function(err,ph) {
                if(err) {
                    console.log(err);
                }
                openPage(ph);
            }, {
                phantomPath : 'C:/phantomjs-1.9.2-windows/phantomjs-1.9.2-windows/phantomjs'
            });
        }
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


};