/*global eyeballControllers*/

eyeballControllers.controller('GlobalCtrl',['$scope','$location','logger',

    function GlobalCtrl($scope,$location,logger) {
        logger.log("GlobalCtrl");

        $scope.quickTest = function(url){
            url = url || $scope.quickUrl;
            $scope.$broadcast("quickTest",url);
        };

        $scope.quickFind = function() {
            $location.path('/report').search({url : $scope.quickUrl});
        };

        $scope.setPage = function(page) {
            $scope.page = page;
        };

        $scope.page = "global";

    }

]);

