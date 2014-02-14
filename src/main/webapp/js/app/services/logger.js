/*global eyeballApp, console*/

eyeballApp.service('logger',function(){

    return {
        log : function(msg) {
            if(eyeballApp.env === "development") {
                console.log(msg);
            }
        }
    };

});