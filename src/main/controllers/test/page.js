/*global window, document*/

var EyeballControllersTestPage = function() {

    var Q = require('q');
    var _ = require('lodash');

    function setupPage(page) {

        page.resources = [];
        page.libraryPath = "../";
        page.settings = {
            resourceTimeout : 5000
        };
        page.errors = {
            js : [],
            resources : []
        };
        page.issues = {
            alert : [],
            console : []
        };
        page.resourceCount = 0;

        page.finished = Q.defer();
        page.received = [];

        page.onResourceRequested = function (req) {
            page.resourceCount++;
            page.resources[req[0].id] = {
                request: req[0],
                startReply: null,
                endReply: null,
                eyeballSize : null,
                complete : Q.defer()
            };
            page.received.push(page.resources[req[0].id].promise);
        };

        page.onResourceReceived = function (res) {
            if(!page.resources[res.id]) {
                return;
            }
            var eyeballSize = _.find(res.headers,{name : 'eyeball-size'});
            if(eyeballSize) {
                page.resources[res.id].eyeballSize = Number(eyeballSize.value);
            }
            if (res.stage === 'start') {
                page.resources[res.id].startReply = res;
            }
            if (res.stage === 'end') {
                page.resources[res.id].endReply = res;
                page.resources[res.id].complete.resolve();
            }

        };

        page.onLoadFinished = function() {
            setTimeout(page.finished.resolve,
            1000);
        };

        page.setFn('onCallback',function(msg) {
            if(msg === "DOMContentLoaded") {
                page.evaluate(function(){
                    window.DOMContentLoaded = new Date().getTime();
                });
            }
        });

        page.setFn('onInitialized',function(){
            page.evaluate(function() {
                document.addEventListener('DOMContentLoaded', function() {
                    window.callPhantom('DOMContentLoaded');
                }, false);
            });
        });

        page.onError = function(err) {
            page.errors.js.push(err);
        };

        page.onResourceError = function(err) {
            page.errors.resources.push(err);
        };

        page.onResourceTimeout = page.onResourceError;

        page.onAlert = function(msg) {
            page.issues.alert.push(msg);
        };

        page.onConsoleMessage = function(msg) {
            page.issues.console.push(msg);
        };

        return page;
    }

    return {
        setup : setupPage
    };

};

module.exports = EyeballControllersTestPage();