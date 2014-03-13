var EYEBALLTEST = {
    total : 0,
    messages : [
        {
            grade : 'A',
            title : 'Fewer than loads',
            content : "There aren't many of these"
        }
    ]
};

(function(){

    var els = ["DIV","A","P"];

    for(var i=els.length-1; i>=0; i--) {
        EYEBALLTEST[els[i]] = document.getElementsByTagName(els[i]).length;
        EYEBALLTEST.total += EYEBALLTEST[els[i]];
    }

}());