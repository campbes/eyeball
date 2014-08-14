/*global window, document*/

var EyeballControllersTestPage = function() {

    function setupPage(page) {
        page.resources = [];
        page.libraryPath = "../";
        page.settings = {
            resourceTimeout : 5
        };
        page.errors = [];

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
            page.errors.push(err);
        };

        return page;
    }

    return {
        setup : setupPage
    };

};

module.exports = EyeballControllersTestPage();