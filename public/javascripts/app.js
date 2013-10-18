var eyeballApp = angular.module('eyeballApp',[
    'ngRoute',
    'eyeballControllers'
]);

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

eyeballApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/report', {
                templateUrl: '/partials/report',
                controller : 'ReportCtrl'
            }).when('/report/yslow', {
                templateUrl: '/partials/yslow',
                controller : 'ReportCtrl'
            }).otherwise({
                  redirectTo: '/report'
            });
    }]);

var eyeballControllers = angular.module('eyeballControllers',[]);


eyeballControllers.controller('ReportCtrl',['$scope','$http','$location','$timeout','$routeParams',

    function ReportCtrl($scope,$http,$location,$timeout,$routeParams) {
        console.log("ReportCtrl");
        $scope.results = [];
        $scope.totals = {};
        $scope.query = $routeParams;

        var queryString = ($location.url().indexOf("?") > -1 ? $location.url().split("?")[1] : "");

        $scope.queryString = queryString;

        $scope.getResults = function(url,updateTotals) {
            $http({
                url: url + '?'+queryString,
                method: "GET"
            }).success(function(results) {
                    $scope.results = results;
                    updateTotals();
                });
        };

        $scope.popover = function(e,metric) {
            console.log(metric);
            $scope.popoverContent = metric;
            $timeout(function(){
                var el = $(e.srcElement);
                el.popover({
                    html : true,
                    content : $('#popoverContent').html(),
                    placement: 'left',
                    container : 'body',
                    trigger : 'hover'
                }).popover('show');
            },1);
        };

        var tables = document.getElementsByTagName('table');
        for (var i=tables.length-1; i>=0; i--) {
            new Tablesort(tables[i]);
        }

    }
]);


eyeballControllers.controller('ReportOverviewCtrl',['$scope',

    function ReportOverviewCtrl($scope) {
        console.log("ReportOverviewCtrl");

        $scope.getResults('report', function() {
            $scope.totals = {
                time : totals.getTotal($scope.results,'yslow','lt'),
                yslow : {
                    o : totals.getTotal($scope.results,'yslow','o')
                },
                dommonster : {
                    COMPOSITE_stats : totals.getTotal($scope.results,'dommonster','COMPOSITE_stats')
                }
            };
        });
    }
]);

eyeballControllers.controller('ReportYslowCtrl',['$scope',

    function ReportOverviewCtrl($scope) {
        console.log("ReportOverviewCtrl");

        $scope.getResults('report/yslow', function() {
            $scope.totals = {
                yslow : {
                    o : totals.getTotal($scope.results,'yslow','o'),
                    w : totals.getTotal($scope.results,'yslow','w'),
                    w_c : totals.getTotal($scope.results,'yslow','w_c'),
                    r : totals.getTotal($scope.results,'yslow','r')
                }
            };
        });
    }
]);

eyeballControllers.controller('TestCtrl',['$scope','$http','$location','testDataStore','socket',

    function TestCtrl($scope,$http,$location,testDataStore,socket) {
        console.log("TestCtrl");
        $scope.testCriteria = {};
        var testData = testDataStore.get()
        $scope.testInfo = testData;

        if(testData.testing === true) {
            var conn = socket();
            conn.on("commitRecord_"+testData.build,function(data) {
                console.log("listened");
                console.log($scope.results);
                $scope.testInfo.progress = data.progress;
                $scope.results.push(data.record);
                $scope.updateTotals();
                if(data.progress === 100) {
                    console.log("disconnecting");
                    conn.disconnect();
                    $scope.testInfo.status = "";
                    $scope.testInfo.message = "Testing...done!";
                }
            });
        }


        $scope.test = function() {
            $scope.testCriteria.build =(new Date()).getTime().toString() + Math.random().toString();

            testDataStore.set({
                testing : true,
                progress : 0,
                status : "active",
                message : "Testing...",
                build : $scope.testCriteria.build
            });

            $location.path('/report/?build='+$scope.testCriteria.build);

            $http({
                url: '/test',
                method: "POST",
                data : $scope.testCriteria
            }).success(function() {
                console.log("posted");
            });
        }

    }

]);




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
