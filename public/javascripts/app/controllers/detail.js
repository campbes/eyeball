eyeballControllers.controller('DetailCtrl',['$scope','$routeParams','$http','fieldConfig','render',

    function DetailCtrl($scope,$routeParams,$http,fieldConfig,render) {

        $scope.id = $routeParams.id.substr(1);

        $http({
            url: '/detail?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
            $scope.data = data;
                console.log(data);
        });

        $scope.fields = fieldConfig.overview;
        $scope.fieldConfig = fieldConfig;
        $scope.format = render.format;

    }

]);