eyeballControllers.controller('DetailCtrl',['$scope','$routeParams','$http',

    function DetailCtrl($scope,$routeParams,$http) {

        $http({
            url: '/detail?id='+$routeParams.id.substr(1),
            method: "GET"
        }).success(function(data) {
            $scope.data = data;
        });

    }

]);