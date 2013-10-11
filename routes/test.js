var request = require('request');

exports.test = function(req,res) {

    var YSLOW = require('yslow').YSLOW;
    var jsdom = require('jsdom');
    var w3c = require('w3c-validate').createValidator();

    var phantom = require('node-phantom');

    var urls = [
        'http://uk.practicallaw.com',
        'http://us.practicallaw.com',
        'http://uk.practicallaw.com',
        'http://us.practicallaw.com',
        'http://uk.practicallaw.com',
        'http://us.practicallaw.com',
        'http://uk.practicallaw.com',
        'http://us.practicallaw.com',
        'http://uk.practicallaw.com',
        'http://us.practicallaw.com'
    ];

    var tests = ['har','yslow','validator'];

    function commitRecord(record){
        clearTimeout(record.recordTimer);
        console.log("ATOMIC!");
    }

    function updateRecord(record,property,data) {
        record[property] = data;

        for(var i in tests) {
            if(tests.hasOwnProperty(i)) {
                if(!record[tests[i]]) {
                    console.log("No entry for" +i);
                    return;
                }
            }
        }

        commitRecord(record);

    }

    function getDomMonster(page,callback) {

        var dm = {};

        jsdom.env(page.content,['http://mir.aculo.us/dom-monster/dommonster.js'],function(err,window) {
            //var script = window.document.createElement("SCRIPT");
            //script.src = 'http://mir.aculo.us/dom-monster/dommonster.js';
            //script.type = 'text/javascript';
            //window.document.getElementsByTagName("HEAD")[0].appendChild(script);
            setTimeout(function(){
                console.log(window.document.body.innerHTML);
                window.close();
            },3000);
        });


        callback(dm);

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

        var record = {};

        record.recordTimer = setTimeout(function(){
            commitRecord(record);
        },10000);

        createHAR(page,function(har){
            console.log("created har");
            updateRecord(record,'har',har);

            var yslow = YSLOW.util.getResults(YSLOW.harImporter.run(jsdom.jsdom(), har, 'ydefault').context, 'all');
            console.log('got yslow result');
            updateRecord(record,'yslow',yslow);

            getDomMonster(page,function(dm){
                console.log(dm);
            });

        });

        function validate(url,html) {
            var requestW3c = request.defaults({'proxy':'http://cache2.practicallaw.com:8080'});
            requestW3c.post({
                url : 'http://validator.w3.org/check',
                form:{
                    fragment:html,
                    output: 'json'
                },
                headers : {
                    'User-Agent': 'Eyeball'
                }
            },function(err,response,body) {
                if (!err && response.statusCode == 200) {
                    updateRecord(record,'validator',body);
                }
            });
        }

        validate(page.address,page.content);
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

    var phantomMax = 5;

    if(urls.length < phantomMax) {
        phantomMax = urls.length;
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
};