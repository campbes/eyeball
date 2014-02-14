/*global eyeballApp*/

eyeballApp.service('persist',function(){

    var persist = {};

    return {
        get : function(key) {
            return persist[key];
        },
        set : function(key,data) {
            persist[key] = data;
        }
    };

});