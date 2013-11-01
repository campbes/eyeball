eyeballControllers.controller('TestCtrl',['$scope','$http','$location','persist','socket','$timeout',

    function TestCtrl($scope,$http,$location,persist,socket,$timeout) {
        console.log("TestCtrl");
        $scope.testCriteria = {};
        var testInfo = persist.get('testInfo') || {};
        $scope.testInfo = testInfo;

        persist.set('testInfo',{
            testing : false,
            progress : 0,
            status : "",
            message : "Testing...",
            build : $scope.testCriteria.build
        });

        if(testInfo.testing === true) {
            var conn = socket();
            conn.on("commitRecord_"+testInfo.build,function(data) {
                console.log("listened");
                $scope.testInfo.progress = data.progress;
                $scope.pushResults(data.record);
                //$scope.updateTotals();
                if(data.progress === 100) {
                    console.log("disconnecting");
                    conn.disconnect();
                    $scope.testInfo.status = "";
                    $scope.testInfo.message = "Testing...done!";
                    // separate property owned by parent scope
                    $scope.$emit('testComplete');
                }
            });
        }


        $scope.test = function() {

            $scope.testCriteria.build =(new Date()).getTime().toString() + Math.random().toString();

            persist.set('testInfo',{
                testing : true,
                progress : 0,
                status : "active",
                message : "Testing...",
                build : $scope.testCriteria.build
            });

            $timeout(function(){
                $location.path('/report').search({build : $scope.testCriteria.build});

                $http({
                    url: '/test',
                    method: "POST",
                    data : $scope.testCriteria
                }).success(function() {
                        console.log("posted");
                    });
            },500);
        }

    }

]);