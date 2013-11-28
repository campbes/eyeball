eyeballControllers.controller('MonitorCtrl',['$scope','$routeParams','$http','fieldConfig','render','persist',

    function MonitorCtrl($scope,$routeParams,$http,fieldConfig,render,persist) {

        $http({
            url: '/monitor',
            method: "GET"
        }).success(function(data) {
                $scope.data = data;
                console.log(data)
            });

    }

]);