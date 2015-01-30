/*global eyeballControllers*/

eyeballControllers.controller('TestCtrl',['settings','$scope','$http','$location','persist','socket','$timeout','logger',

    function TestCtrl(settings,$scope,$http,$location,persist,socket,$timeout,logger) {
        logger.log("TestCtrl");
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

        var conn = null;

        if(testInfo.testing === true) {
            if (conn) {
                logger.log("old connection left over - killing");
                conn.disconnect();
                conn = null;
            }
            conn = socket();
            conn.on("commitRecord_"+testInfo.build,function(data) {
                logger.log("listened");
                $scope.testInfo.progress = data.progress;
                $scope.pushResults(data.record);
                //$scope.updateTotals();
                if(data.progress === 100) {
                    logger.log("disconnecting");
                    conn.disconnect();
                    $scope.testInfo.status = "";
                    $scope.testInfo.message = "Testing...done!";
                    // separate property owned by parent scope
                    $scope.$emit('testComplete');
                } else {
                    $scope.testInfo.message = "Testing..." + data.committed+" of "+data.total;
                }
            });
        }


        $scope.test = function() {
            logger.log($scope.testCriteria);

            if($scope.testCriteria.url && $scope.testCriteria.url.indexOf("://") === -1) {
                $scope.testCriteria.url = "http://" + $scope.testCriteria.url;
            }

            $http({
                url: '/'+settings.apiVersion+'/test',
                method: "POST",
                data : $scope.testCriteria
            }).success(function(data) {
                logger.log("Testing build id: "+data.build);
                $scope.testCriteria.build = data.build;
                persist.set('testInfo',{
                    testing : true,
                    progress : 0,
                    status : "active",
                    message : "Testing...",
                    build : $scope.testCriteria.build
                });
                $location.path('/report').search({build : $scope.testCriteria.build});
            });

        };

        $scope.$on("quickTest",function(sc,url) {
            logger.log("heard quicktest: "+sc);
            $scope.testCriteria = {
                url : url
            };
            $scope.test();
        });

    }

]);

eyeballControllers.controller('TestMainCtrl',['$scope','logger',

    function TestMainCtrl($scope,logger) {
        logger.log("TestMainCtrl");
        $scope.setPage("test");
    }

]);