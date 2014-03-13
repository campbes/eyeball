module.exports = function(testers){

    var tests = {
        browser : [{
            name : 'dommonster',
            src: 'lib/dommonster.js',
            extractor : testers.dommonster
        }],
        har : [{
            name : 'yslow',
            extractor : testers.yslow
        }],
        markup : [{
            name : 'validator',
            extractor : testers.validator
        }]
    };

    return tests;

};