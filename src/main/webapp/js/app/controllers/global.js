eyeballControllers.controller('GlobalCtrl',['$scope','$location',

    function GlobalCtrl($scope,$location) {
        console.log("GlobalCtrl");

        $scope.quickTest = function(url){
            console.log(url)
            url = url || $scope.quickUrl;
            console.log("quicktest: "+url)
            $scope.$broadcast("quickTest",url);
        };

        $scope.quickFind = function() {
            $location.path('/report').search({url : $scope.quickUrl});
        };

    }

]);
