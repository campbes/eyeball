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
            }).otherwise({
                  redirectTo: '/report'
            });
    }]);

var eyeballControllers = angular.module('eyeballControllers',[]);