eyeballControllers.controller('GlobalCtrl',['$scope',

    function GlobalCtrl($scope) {
        console.log("GlobalCtrl");

        $scope.quickTest = function(url){
            console.log(url)
            url = url || $scope.quickUrl;
            console.log("quicktest: "+url)
            $scope.$broadcast("quickTest",url);
        };

        $scope.quickFind = function() {
            $scope.$broadcast("quickFilter",$scope.quickUrl);
        };

    }

]);
