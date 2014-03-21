/*global eyeballControllers,$*/

eyeballControllers.controller('DetailCtrl',['$scope','$routeParams','$http','config','render','persist','utils',

    function DetailCtrl($scope,$routeParams,$http,config,render,persist,utils) {

        config = config.data.report;
        $scope.id = $routeParams.id.substr(1);

        $http({
            url: '/detail?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
            $scope.data = data;
            $scope.url = data.url;
            $scope.timestamp = data.timestamp;
            $scope.build = data.build;
            $scope.tag = data.tag;
            $scope.fields = config.fields.display.items;
            $scope.fieldConfig = config.fields;
            if($routeParams.anchor) {
                setTimeout(function(){
                    utils.scrollTo("panel_"+$routeParams.anchor);
                },1);
            }
        });

        $scope.format = render.format;
        $scope.reportFilter = persist.get("reportFilter");
        $scope.getVal = render.accessObject;
        $scope.getInfo = render.getInfo;

    }

]);

