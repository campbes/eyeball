eyeballApp.factory('socket', function ($rootScope) {

    function connection() {
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            },
            disconnect : function() {
                socket.disconnect();
            }
        };
    }
    return connection;
});

eyeballApp.service('testDataStore',function(){

    var testData = {};

    return {
        get : function() {
            return testData;
        },
        set : function(data) {
            testData = data;
        }
    }

});

eyeballApp.factory('exos',function() {

    function init(popover) {
        Exos.enable([
            {'td[data-type="grades"]' : {
                'mouseenter' : {
                    fn : popover.show
                },
                'mouseleave' : {
                    fn : popover.hide
                }
            }}
        ]);

    }

    return {
        init : init
    }

});

eyeballApp.factory('tablesort',function() {
    return {
        init : function() {
            var tables = document.getElementsByTagName('table');
            for (var i=tables.length-1; i>=0; i--) {
                new Tablesort(tables[i]);
            }
        }
    }
});

eyeballApp.factory('popover',function(){
    return {
        show : function(e,obj) {
            var el = $(obj);
            el.popover({
                html : true,
                content : $('#popoverContent').html(),
                placement: 'left',
                container : 'body',
                trigger : 'manual'
            }).popover('show');

        },
        hide : function(e,obj) {
            $(obj).popover('destroy');
        }
    }
});

eyeballApp.factory('render',function() {

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
                class : ""
            };

            if(pc > 85) {
                total.grade = "A";
                total.message = "PASS";
                total.class = "success";
            } else if (pc <= 85) {
                total.grade = "F";
                total.message = "FAIL";
                total.class = "danger";
            }
            return total;
        }

        return {
            getTotal : getTotal
        };

    }());

    function accessObject(obj,str) {

        function getProp(obj,key) {
            return obj[key];
        }

        var keys = str.split(".");
        var keysLength = keys.length;
        var i = null;

        for (i=0; i<keysLength; i++) {
            if(!obj) {
                return null;
            }
            obj = getProp(obj,keys[i]);
        }
        return obj;
    }

    return {
        totals : totals,
        accessObject : accessObject
    }

});


