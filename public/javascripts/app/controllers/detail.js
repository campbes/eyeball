eyeballControllers.controller('DetailCtrl',['$scope','$routeParams','$http',

    function DetailCtrl($scope,$routeParams,$http) {

        $scope.id = $routeParams.id.substr(1);

        $http({
            url: '/detail?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
            $scope.data = data;
        });

    }

]);