/*global eyeballApp*/

eyeballApp.factory('render',function() {

    function accessObject(obj,str) {

        if(!obj){
            return null;
        }
        var keys = str.split(".");
        var keysLength = keys.length;
        if(keys.length === 1) {
            return obj[keys[0]];
        }
        var i = null;
        for (i=0; i<keysLength; i++) {
            obj = obj[keys[i]] || obj;
        }
        return obj;
    }

    function format(val,type) {

        if(typeof val === "object") {
            return "";
        }

        switch(type) {
            case "size" :
                if(val > 1024) {
                    val = val/102.4;
                    val = Math.round(val);
                    return val/10+ " KB";
                }
                return val+ " B";
            case "time" :
                if(val > 1000) {
                    val = val/10;
                    val = Math.round(val);
                    return val/100+ " s";
                }
                return val+ " ms";
            default:
                return val;
        }
    }

    var totals = (function() {

        function getPC(results,tool,measure) {
            var fails = 0;
            var count = 0;
            var i = null;
            var res = null;
            var grade = null;

            for (i=results.length-1; i>=0; i--) {
                if(!results[i].metrics) {
                    continue;
                }
                res = results[i].metrics[tool];
                if(!res || !res.grades) {
                    continue;
                }

                grade = accessObject(res.grades,measure);

                if(!grade) {
                    continue;
                }
                count += 1;
                if(grade !== "A" && grade !== "B") {
                    fails +=1;
                }
            }
            return Math.floor(100 - (fails/(count/100)));
        }

        function getTotal(results,tool,measure) {

            var pc = getPC(results,tool,measure);
            var total = {
                score : pc,
                grade : "",
                message : "",
                className : ""
            };

            if(pc > 85) {
                total.grade = "A";
                total.status = "PASS";
                total.className = "success";
                total.message = pc + "% >= B";
            } else if (pc <= 85) {
                total.grade = "F";
                total.status = "FAIL";
                total.className = "danger";
                total.message = (100-pc) + "% < B";
            }

            total.tooltip = "Pass mark is 85% of tests >= B";

            return total;
        }

        return {
            getTotal : getTotal
        };

    }());

    function getInfo(obj,tool,str) {
        var val = accessObject(obj,str);

        var info = {
            time : {
                lt : {
                    A : {info : "less than 2 seconds",message : "User perceives page as loading almost immediately."},
                    B : {info : "less than 3 seconds",message : "User may notice a delay in page loading, but the overall experience is not affected."},
                    C : {info : "less than 4 seconds",message : "User notices a delay which may spoil the experience."},
                    D : {info : "less than 5 seconds",message : "User notices a significant delay which may discourage further usage."},
                    E : {info : "less than 6 seconds",message : "User notices a significant delay and will likely become frustrated and may give up."},
                    F : {info : "more than 6 seconds",message : "User will become very frustrated, give up, and likely not return"}
                },
                dt : {
                    A : {info : "less than 1 second",message : "User perceives page as loading almost immediately."},
                    B : {info : "less than 2 seconds",message : "User may notice a delay in page loading, but the overall experience is not affected."},
                    C : {info : "less than 3 seconds",message : "User notices a delay which may spoil the experience."},
                    D : {info : "less than 4 seconds",message : "User notices a significant delay which may discourage further usage."},
                    E : {info : "less than 5 seconds",message : "User notices a significant delay and will likely become frustrated and may give up."},
                    F : {info : "more than 5 seconds",message : "User will become very frustrated, give up, and likely not return"}
                }
            },
            eyeball : {
                eyeball : {
                    A : {info : "Excellent!",message:"Your page is awesome!",type:'success'},
                    C : {info : "Okay",message:"There are some problems with your page - you could make it better.",type:'warning'},
                    E : {info : "Awful!",message:"There are serious problems with your page - you need to fix them.",type:'danger'}
                }
            }
        };

        info.eyeball.eyeball.B = info.eyeball.eyeball.A;
        info.eyeball.eyeball.D = info.eyeball.eyeball.C;
        info.eyeball.eyeball.F = info.eyeball.eyeball.E;
        info.eyeball.dom = info.eyeball.eyeball;
        info.eyeball.performance = info.eyeball.eyeball;

        info.time.lt_u = info.time.lt;
        info.time.dt_u = info.time.dt;

        return info[tool][str][val];

    }

    return {
        totals : totals,
        accessObject : accessObject,
        format : format,
        getInfo: getInfo
    };

});
