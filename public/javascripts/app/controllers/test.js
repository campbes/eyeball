eyeballControllers.controller('TestCtrl',['$scope','$http','$location','testDataStore','socket','$timeout',

    function TestCtrl($scope,$http,$location,testDataStore,socket,$timeout) {
        console.log("TestCtrl");
        $scope.testCriteria = {};
        var testData = testDataStore.get();
        $scope.testInfo = testData;

        testDataStore.set({
            testing : false,
            progress : 0,
            status : "",
            message : "Testing...",
            build : $scope.testCriteria.build
        });

        if(testData.testing === true) {
            var conn = socket();
            conn.on("commitRecord_"+testData.build,function(data) {
                console.log("listened");
                $scope.testInfo.progress = data.progress;
                $scope.pushResults(data.record);
                //$scope.updateTotals();
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