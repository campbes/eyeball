/*global window, document*/

var EyeballControllersTestPage = function() {

    var Q = require('q');

    function setupPage(page) {

        page.resources = [];
        page.libraryPath = "../";
        page.settings = {
            resourceTimeout : 5
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

        page.onResourceRequested = function (req) {
            page.resourceCount++;
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

        page.onLoadFinished = function() {
            console.log(page.resourceCount);
            page.finished.resolve();
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