eyeballControllers.controller('HarCtrl',['$scope','$routeParams','$http','tablesort',

    function HarCtrl($scope,$routeParams,$http,tablesort) {

        $scope.id = $routeParams.id.substr(1);

        $http({
            url: '/detail?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
                $scope.data = data;
                var viewer = new Harpy.Viewer(JSON.stringify(data.metrics.har.data));
                viewer.draw("harContainer");
                //tablesort.init();
            });

    }

]);