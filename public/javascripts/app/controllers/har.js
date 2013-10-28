eyeballControllers.controller('HarCtrl',['$scope','$routeParams','$http',

    function HarCtrl($scope,$routeParams,$http) {

        $scope.id = $routeParams.id.substr(1);

        $http({
            url: '/detail?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
                $scope.data = data;

                var viewer = new Harpy.Viewer(JSON.stringify(data.metrics.har.data),{
                    tablesize : 800
                });
                viewer.draw("harContainer");
            });

    }

]);