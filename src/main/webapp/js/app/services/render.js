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
                total.message = "PASS";
                total.className = "success";
            } else if (pc <= 85) {
                total.grade = "F";
                total.message = "FAIL";
                total.className = "danger";
            }
            return total;
        }

        return {
            getTotal : getTotal
        };

    }());

    function getInfo(obj,str) {
        var val = accessObject(obj,str);

        var info = {
            lt : {
                A : "less than 2 seconds",
                B : "less than 3 seconds",
                C : "less than 4 seconds",
                D : "less than 5 seconds",
                E : "less than 6 seconds",
                F : "more than 6 seconds"
            },
            dt : {
                A : "less than 1 second",
                B : "less than 2 seconds",
                C : "less than 3 seconds",
                D : "less than 4 seconds",
                E : "less than 5 seconds",
                F : "more than 5 seconds"
            }
        };

        info.lt_u = info.lt;
        info.dt_u = info.dt;

        var ret = {
            info : info[str][val]
        };

        switch(val) {
            case 'A':
                ret.message = "User perceives page as loading almost immediately.";
                break;
            case 'B':
                ret.message = "User may notice a delay in page loading, but the overall experience is not affected.";
                break;
            case 'C':
                ret.message = "User notices a delay which may spoil the experience.";
                break;
            case 'D':
                ret.message = "User notices a significant delay which may discourage further usage.";
                break;
            case 'E':
                ret.message = "User notices a significant delay and will likely become frustrated and may give up.";
                break;
            case 'F':
                ret.message = "User will become very frustrated, give up, and likely not return";
                break;
        }

        return ret;

    }

    return {
        totals : totals,
        accessObject : accessObject,
        format : format,
        getInfo: getInfo
    };

});
