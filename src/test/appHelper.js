var eyeball = {
    logger : {
        error : function(){},
        info : function(){}
    }
};

var exports = function () {
    return;
};

var module = {};

var spies = {};


var helpers = {
    require : function(name) {

        function returnIfExists(funcName) {
            if(window[funcName]) {
                return window[funcName]();
            }
            return null;
        }

        if(name === "fs") {

            var obj = {
                writeFile : function(file,data,cb) {
                    return cb();
                },
                unlink : function(){}
            };
            spies.writeFile = spyOn(obj,"writeFile");

            return obj;

        } else if(name === "yslow") {
            return {
                YSLOW : {
                    harImporter : {
                        run : function() {
                            return {
                                context : {
                                    PAGE : {
                                        overallScore : 90
                                    },
                                    result_set : {
                                        getRulesetApplied : function(){
                                            return {};
                                        },
                                        getResults: function(){
                                            return [{score : 90, message : 'I love eyeball',rule_id : "overall"}];
                                        }
                                    }
                                }
                            };
                        }
                    },
                    util : {
                        isArray : function(){},
                        getPageSpaceid : function(){}
                    }
                }
            }
        } else if (name === "jsdom") {
            return {
                jsdom : function() {}
            }
        } else if (name.indexOf('/conf/test') !== -1){
            return returnIfExists("testCfg");
        } else if (name === './grader'){
            return returnIfExists("testControllerGrader");
        } else if (name === './yslowOverride'){
           return returnIfExists("testControllerYslowOverride");
        } else if(name === "child_process") {
            var on = function(evt,cb){
                return cb();
            };
            var stdout = {
                on : on
            };
            var stderr = stdout;
            return {
                spawn : function(){
                    return {
                        on : on,
                        stdout : stdout,
                        stderr : stderr
                    }
                }
            }
        }

        return function(args) {
            return args || {};
        }
    },
    res : {
        headers : {},
        setHeader : function(name,value) {
            this.headers[name] = value;
        },
        send : function(output) {
            this.output = output;
        }
    }
};

require = helpers.require;