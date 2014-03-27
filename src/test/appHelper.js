var eyeballTestData = {};

var eyeball = {
    logger : {
        error : function(){},
        info : function(){}
    },
    DB : {
        find : function(dbQuery,cfg,dbCfg) {
            if(typeof cfg === "function") {
                return cfg(null,eyeballTestData);
            }
            eyeballTestData = {
                dbQuery : dbQuery,
                cfg : cfg,
                dbCfg : dbCfg
            };
            return {
                sort : function(cfg,cb) {
                    cb();
                }
            }
        }
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
                readFile: function() {},
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
                    },
                    doc : {
                        rules : {
                            myMadeUpRule : {
                                name : "Test rule"
                            }
                        }
                    }
                }
            }
        } else if (name === "jsdom") {
            return {
                jsdom : function() {}
            }
        } else if (name.indexOf('/conf/test') !== -1){
            return returnIfExists("configTest");
        } else if (name.indexOf('/conf/report') !== -1){
            return returnIfExists("configReport");
        } else if (name === './grader'){
            return returnIfExists("testControllerGrader");
        } else if (name === './yslowOverride'){
           return returnIfExists("testControllerYslowOverride");
        } else if (name.indexOf('controllers/test/test') !== -1){
            return testController;
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
        } else if(name === "url") {
            return {
                init : function(data) {
                    eyeballTestData = data;
                },
                parse : function() {
                    return eyeballTestData;
                }
            }
        } else if (name === "node-phantom") {
            return {
                create : function(){}
            }
        } else if (name === "mongojs") {
            return {
                ObjectId : function(){}
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