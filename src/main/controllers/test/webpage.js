/*global window, document*/

var EyeballControllersTestWebpage = function() {

    function getInPageTestData() {
        return {
            EYEBALLTEST : window.EYEBALLTEST
        };
    }

    function augment(test,doc) {
        test.webpage.title = doc.title;
        test.webpage.content = doc.content;
        test.webpage.onContentLoad = new Date(doc.onContentLoad);
        test.webpage.resources = [].concat(test.page.resources);
        test.webpage.EYEBALLTEST = {};
        return test;
    }

    function details() {
        return {
            title : document.title,
            content : document.documentElement.outerHTML,
            onContentLoad : window.DOMContentLoaded
        };
    }

    function create(test) {
        return {
            endTime : new Date(),
            address : test.pageUrl,
            startTime : test.start
        };
    }

    return {
        create : create,
        details : details,
        augment : augment,
        getTestData : getInPageTestData
    };

};

module.exports = EyeballControllersTestWebpage();