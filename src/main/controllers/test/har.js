var EyeballControllersTestHar = function() {

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
            if (request.url.indexOf("data:image") > -1) {
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

        var har = {
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
        };

        callback(har);

        return har;
    }

    function combineHARs(hars) {

        var har = hars[0];
        var cachedHar = hars[1];

        function matchEntry(url) {
            var i = 0;
            for(i=cachedHar.log.entries.length-1; i>=0; i--) {
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

        var i =0;
        var entry;
        var matched;
        for (i=0; i<har.log.entries.length; i++) {
            matched = matchEntry(har.log.entries[i].request.url);
            if(!matched) {
                entry = {
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

    return {
        create : createHAR,
        combine : combineHARs
    };

};

module.exports = EyeballControllersTestHar();