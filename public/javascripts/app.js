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

eyeballApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/report', {
                templateUrl: '/partials/report'
            }).when('/report/:query', {
                templateUrl: '/partials/report'
            }).
            otherwise({
                  redirectTo: '/report'
            });
    }]);

var eyeballControllers = angular.module('eyeballControllers',[]);

eyeballControllers.controller('ReportCtrl',['$scope','$http','$routeParams','socket',

    function ReportCtrl($scope,$http,$routeParams,socket) {
        console.log("ReportCtrl");
        $scope.results = [];

        var queryString = ($routeParams.query ? $routeParams.query.split(":")[1] : '');
        var query = queryString.split("&");
        var queryParams = {};
        for (var i=0; i<query.length; i++) {
            var qComp = query[i].split("=");
            if(qComp[1]) {
                queryParams[qComp[0]] = qComp[1];
            }
            console.log(queryParams);
        }

        if(queryParams.build) {

            $scope.$on("test_"+queryParams.build,function(){
                console.log("Listened to test broadcast");

                $scope.testInfo = {
                    testing : true,
                    progress : 0,
                    status : "active",
                    message : "Testing..."
                };

                var conn = socket();

                conn.on("commitRecord_"+queryParams.build,function(data) {
                    console.log("listened");
                    $scope.testInfo.progress = data.progress;
                    $scope.results.push(data.record);
                    if(data.progress === 100) {
                        console.log("disconnecting");
                        conn.disconnect();
                        $scope.testInfo.status = "";
                        $scope.testInfo.message = "Testing...done!";
                    }
                });
            });
        }

        $http({
            url: '/report?'+queryString,
            method: "GET"
        }).success(function(results) {
            $scope.results = results;
        });

    }
]);

eyeballControllers.controller('TestCtrl',['$rootScope','$scope','$http','$location','$timeout',

    function TestCtrl($rootScope,$scope,$http,$location,$timeout) {
        $scope.testCriteria = {};
        console.log("TestCtrl");
        $scope.test = function() {
            $scope.testCriteria.build =(new Date()).getTime().toString() + Math.random().toString();
            $location.path('/report/:build='+$scope.testCriteria.build);
            $timeout(function(){
                $rootScope.$broadcast("test_"+$scope.testCriteria.build);
            },1);

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
