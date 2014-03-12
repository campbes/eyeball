/*global angular,google*/

var eyeballApp = angular.module('eyeballApp',[
    'ngRoute',
    'eyeballControllers'
]);

eyeballApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/report', {
                redirectTo: '/report/overview'
            }).when('/report/overview', {
                templateUrl: '/partials/report/overview',
                controller : 'ReportCtrl'
            }).when('/report/:report', {
                templateUrl: '/partials/report/standard',
                controller : 'ReportCtrl'
            }).when('/detail/:id', {
                templateUrl: '/partials/detail',
                controller : 'DetailCtrl'
            }).when('/har/:id', {
                templateUrl: '/partials/har',
                controller : 'HarCtrl'
            }).when('/history/:id', {
                templateUrl: '/partials/history',
                controller : 'HistoryCtrl'
            }).when('/monitor', {
                templateUrl: '/partials/monitor',
                controller : 'MonitorCtrl'
            }).when('/test', {
                templateUrl: '/partials/test',
                controller : 'TestMainCtrl'
            }).otherwise({
                redirectTo: '/test'
            });
    }]);

var eyeballControllers = angular.module('eyeballControllers',[]);

eyeballApp.run(['exos','utils',
    function(exos,utils) {
        exos.enable([{"button[data-anchor]" : {
            click : function(e, obj) {
                utils.scrollTo(obj.getAttribute("data-anchor"));
            }
        }}]);
    }
]);

google.load('visualization', '1.0', {'packages':['corechart']});
