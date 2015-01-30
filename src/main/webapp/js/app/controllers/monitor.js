/*global eyeballControllers*/

eyeballControllers.controller('MonitorCtrl',['settings','$scope','$http',

    function MonitorCtrl(settings,$scope,$http) {

        $scope.setPage("monitor");

        $http({
            url: '/'+settings.apiVersion+'/monitor',
            method: "GET"
        }).success(function(data) {
                $scope.data = data;
            });

    }

]);