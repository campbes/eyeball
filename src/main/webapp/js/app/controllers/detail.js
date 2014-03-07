/*global eyeballControllers*/

eyeballControllers.controller('DetailCtrl',['$scope','$routeParams','$http','fieldConfig','render','persist',

    function DetailCtrl($scope,$routeParams,$http,fieldConfig,render,persist) {

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
            $scope.fields = fieldConfig.overview;
            $scope.fieldConfig = fieldConfig;
            setTimeout(function(){
                $('body').animate({
                    scrollTop : $('#panel_'+$routeParams.anchor).offset().top
                });
            },1);
        });

        $scope.format = render.format;
        $scope.reportFilter = persist.get("reportFilter");
        $scope.getVal = render.accessObject;
        $scope.getInfo = render.getInfo;

    }

]);

