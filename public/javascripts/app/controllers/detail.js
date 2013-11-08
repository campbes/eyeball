eyeballControllers.controller('DetailCtrl',['$scope','$routeParams','$http','fieldConfig','render','persist',

    function DetailCtrl($scope,$routeParams,$http,fieldConfig,render,persist) {

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
        $scope.reportFilter = persist.get("reportFilter");

    }

]);