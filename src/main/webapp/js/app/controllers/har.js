/*global eyeballControllers,Harpy,$*/

eyeballControllers.controller('HarCtrl',['settings','$scope','$routeParams','$http','persist','harpy',

    function HarCtrl(settings,$scope,$routeParams,$http,persist,harpy) {

        $scope.id = $routeParams.id.substr(1);
        $scope.reportFilter = persist.get("reportFilter");

        $scope.viewer = null;
        $scope.uncachedViewer = null;

        $scope.$on("$destroy",function() {
            $scope.viewer.destroy();
            $scope.uncachedViewer.destroy();
        });

        $http({
            url: '/v'+settings.apiVersion+'/results/'+$scope.id+'?fields=url,timestamp,build,tag,metrics.har,metrics.harUncached',
            method: "GET"
        }).success(function(data) {
                $scope.data = data;
                $scope.url = data.url;
                $scope.timestamp = data.timestamp;
                $scope.build = data.build;
                $scope.tag = data.tag;

                var har = JSON.stringify(data.metrics.har.data);
                var harUncached = JSON.stringify(data.metrics.harUncached.data);
                var comparator = new Harpy.Comparator(har,harUncached);
                $('#harComparison').html('');
                comparator.draw("harComparison",null,harpy);
                setTimeout(function(){
                    $scope.viewer = new Harpy.Viewer(JSON.stringify(data.metrics.har.data));
                    $('#harContainer').html('');
                    $scope.viewer.draw("harContainer",harpy.pie);
                },500);
                setTimeout(function(){
                    $scope.uncachedViewer = new Harpy.Viewer(JSON.stringify(data.metrics.harUncached.data));
                    $('#harUncached').html('');
                    $scope.uncachedViewer.draw("harUncached",harpy.pie);
                },500);
            });

    }

]);
