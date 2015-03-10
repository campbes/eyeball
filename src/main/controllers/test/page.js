/*global window, document*/

var EyeballControllersTestPage = function() {

    var Q = require('q');
    var _ = require('lodash');

    function setupPage(page) {
        page.timestamp = new Date();
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

        page.set("onResourceRequested",function(data) {

            page.resourceCount++;
            page.resources[data.id] = {
                url : data.url,
                request: data,
                startReply: null,
                endReply: null,
                eyeballSize : null,
                complete : Q.defer()
            };
            page.received.push(page.resources[data.id].complete.promise);
        });

        page.set('onResourceReceived',function (res) {

            if(!page.resources[res.id]) {
                return;
            }
            var eyeballSize = _.find(res.headers,{name : 'x-eyeball-size'});
            var eyeballStatus = _.find(res.headers,{name : 'x-eyeball-status'});
            if(eyeballSize) {
                page.resources[res.id].eyeballSize = Number(eyeballSize.value);
            }
            if(eyeballStatus) {
                page.resources[res.id].eyeballStatus = Number(eyeballStatus.value);
            }
            if (res.stage === 'start') {
                page.resources[res.id].startReply = res;
            }
            if (res.stage === 'end') {
                page.resources[res.id].endReply = res;
                page.resources[res.id].complete.resolve();
            }

        });

        page.set("onLoadFinished",function() {
            setTimeout(page.finished.resolve,
            1000);
        });

        page.set('onCallback',function(msg) {
            if(msg === "DOMContentLoaded") {
                page.evaluate(function(){
                    window.DOMContentLoaded = new Date().getTime();
                });
            }
        });

        page.set('onInitialized',function(){
            page.evaluate(function() {
                document.addEventListener('DOMContentLoaded', function() {
                    window.callPhantom('DOMContentLoaded');
                }, false);
            });
        });

        page.set('onError',function(err) {
            page.errors.js.push(err);
        });

        page.set('onResourceError',function(err) {
            page.errors.resources.push(err);
        });

        page.set('onResourceTimeout',page.onResourceError);

        page.set('onAlert',function(msg) {
            page.issues.alert.push(msg);
        });

        page.set('onConsoleMessage',function(msg) {
            page.issues.console.push(msg);
        });

        return page;
    }

    return {
        setup : setupPage
    };

};

module.exports = EyeballControllersTestPage();