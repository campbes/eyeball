/*global angular*/
"use strict";

var eyeballApp = angular.module('eyeballApp',[
    'ngRoute',
    'eyeballControllers'
]);

eyeballApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/report', {
                templateUrl: '/partials/report/overview',
                controller : 'ReportCtrl'
            }).when('/report/time', {
                templateUrl: '/partials/report/time',
                controller : 'ReportCtrl'
            }).when('/report/yslow', {
                templateUrl: '/partials/report/yslow',
                controller : 'ReportCtrl'
            }).when('/report/dommonster', {
                templateUrl: '/partials/report/dommonster',
                controller : 'ReportCtrl'
            }).when('/report/validator', {
                templateUrl: '/partials/report/validator',
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
            }).otherwise({
                  redirectTo: '/report'
            });
    }]);

var eyeballControllers = angular.module('eyeballControllers',[]);

google.load('visualization', '1.0', {'packages':['corechart']});