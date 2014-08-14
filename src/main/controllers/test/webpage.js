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
        test.webpage.EYEBALL = {
            errors : test.page.errors
        };
        return test;
    }

    function details() {
        var node = document.doctype;
        var doctype = "";
        if(node) {
            doctype = "<!DOCTYPE ";
            doctype += node.name;
            doctype += (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '');
            doctype += (!node.publicId && node.systemId ? ' SYSTEM' : '');
            doctype += (node.systemId ? ' "' + node.systemId + '"' : '');
            doctype += '>';
        }
        return {
            title : document.title,
            content : doctype + document.documentElement.outerHTML,
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