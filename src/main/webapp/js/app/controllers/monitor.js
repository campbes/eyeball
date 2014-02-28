/*global eyeballControllers*/

eyeballControllers.controller('MonitorCtrl',['$scope','$http',

    function MonitorCtrl($scope,$http) {

        $scope.setPage("monitor");

        $http({
            url: '/monitor',
            method: "GET"
        }).success(function(data) {
                $scope.data = data;
            });

    }

]);