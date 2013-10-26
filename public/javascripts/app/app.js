var eyeballApp = angular.module('eyeballApp',[
    'ngRoute',
    'eyeballControllers'
]);

eyeballApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/report', {
                templateUrl: '/partials/report',
                controller : 'ReportCtrl'
            }).when('/report/yslow', {
                templateUrl: '/partials/yslow',
                controller : 'ReportCtrl'
            }).when('/detail/:id', {
                templateUrl: '/partials/detail',
                controller : 'DetailCtrl'
            }).when('/history/:id', {
                templateUrl: '/partials/history',
                controller : 'HistoryCtrl'
            }).otherwise({
                  redirectTo: '/report'
            });
    }]);

var eyeballControllers = angular.module('eyeballControllers',[]);

google.load('visualization', '1.0', {'packages':['corechart']});