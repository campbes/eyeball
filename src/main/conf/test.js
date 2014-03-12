module.exports = function(TestCtrl){

    var tests = {
        browser : [{
            name : 'dommonster',
            src: 'lib/dommonster.js',
            extractor : TestCtrl.testers.dommonster
        }],
        har : [{
            name : 'yslow',
            extractor : TestCtrl.testers.yslow
        }],
        markup : [{
            name : 'validator',
            extractor : TestCtrl.testers.validator
        }]
    };

    return tests;

};