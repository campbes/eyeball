/*global eyeballControllers,Harpy*/

eyeballControllers.controller('HarCtrl',['$scope','$routeParams','$http','persist',

    function HarCtrl($scope,$routeParams,$http,persist) {

        $scope.id = $routeParams.id.substr(1);
        $scope.reportFilter = persist.get("reportFilter");

        $http({
            url: '/detail?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
                $scope.data = data;
                $scope.url = data.url;
                $scope.timestamp = data.timestamp;
                $scope.build = data.build;
                $scope.tag = data.tag;
                var viewer = new Harpy.Viewer(JSON.stringify(data.metrics.har.data));
                viewer.draw("harContainer");
                var uncachedViewer = new Harpy.Viewer(JSON.stringify(data.metrics.harUncached.data));
                uncachedViewer.draw("harUncached");
            });

    }

]);
