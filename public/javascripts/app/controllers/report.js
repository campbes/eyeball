eyeballControllers.controller('ReportCtrl',['$scope','$http','$location','$timeout','$routeParams','exos','popover','tablesort','render','chart','persist',

    function ReportCtrl($scope,$http,$location,$timeout,$routeParams,exos,popover,tablesort,render,chart,persist) {
        console.log("ReportCtrl");

        $scope.results = [];
        $scope.totals = {};
        $scope.query = $routeParams;
        $scope.filterParams = {};
        $scope.popoverContent = null;
        $scope.fields = [];
        $scope.reportView = '';
        $scope.chartOptions = [
            {name : "Date", value : "timestamp"},
            {name : "Build", value : "build"}
        ];
        $scope.charts = [];
        for(var i in $scope.query) {
            if($scope.query.hasOwnProperty(i)) {
                $scope.filterParams[i] = $scope.query[i];
            }
        }

        var testInfo = persist.get('testInfo') || {};
        $scope.busy =  testInfo.testing;

        $scope.$on('testComplete',function() {
            console.log("ok");
            $scope.busy = false;
        });

        var updateTotals = function() {
            for(var i=0; i<$scope.fields.length; i++) {
                if(!$scope.totals[$scope.fields[i].tool]) {
                    $scope.totals[$scope.fields[i].tool] = {};
                }
                $scope.totals[$scope.fields[i].tool][$scope.fields[i].metric] = render.totals.getTotal($scope.results,$scope.fields[i].tool,$scope.fields[i].metric);
            }
        };

        $scope.$watch('results',function(){
            console.log("results changed");
            updateTotals();
        });

        function setupChart(i) {
            var ch = $scope.charts[i];
            $scope.$watch('charts['+i+'].xAxis',function(){
                if($scope.reportView === 'chart') {
                    console.log(ch.tool+" chart changed");
                    $timeout(function(){
                        chart.drawPivotChart($scope.results,ch.xAxis,ch.tool,ch.metric);
                    },1000);
                }
            });
        }

        var queryString = ($location.url().indexOf("?") > -1 ? $location.url().split("?")[1] : "");

        $scope.queryString = queryString;

        $scope.getResults = function(url) {
            $scope.busy = true;
            $http({
                url: url + '?'+queryString,
                method: "GET"
            }).success(function(results) {
                    $scope.results = results;
                    $scope.busy = false;
                    console.log(results)
                });
        };

        $scope.pushResults = function(result) {
            $scope.results = $scope.results.concat([result]);
        };

        $scope.setFields = function(fields) {
            $scope.fields = fields;
            for(var i=0; i<$scope.fields.length; i++) {
                $scope.charts[i] = {
                    tool : $scope.fields[i].tool,
                    metric : $scope.fields[i].metric,
                    name : $scope.fields[i].name,
                    xAxis : $scope.chartOptions[0]
                };
                setupChart(i);
            }
        };

        $scope.setPopoverContent = function(data) {
            console.log(data);
            $scope.popoverContent = data;
        };

        $scope.setReportView = function(view) {
            $scope.reportView = view;
            if(view === 'chart') {
                $timeout(function(){
                    for(var i=0; i<$scope.charts.length; i++) {
                        var ch = $scope.charts[i];
                        chart.drawPivotChart($scope.results,ch.xAxis,ch.tool,ch.metric);
                    }
                },100)
            }
        };

        $scope.filter = function() {
            $timeout(function(){
                $location.path('/report').search($scope.filterParams);
            },500);
        };

        exos.init(popover);
        tablesort.init('table',{
            headers : {
                0 : {
                    sorter : false
                }
            }
        });

    }
]);

eyeballControllers.controller('ReportOverviewCtrl',['$scope','persist','fieldConfig',

    function ReportOverviewCtrl($scope,persist,fieldConfig) {
        console.log("ReportOverviewCtrl");

        $scope.setFields(fieldConfig.overview);
        $scope.fieldConfig = fieldConfig;

        var testInfo = persist.get('testInfo') || {};

        if(!testInfo.testing) {
            $scope.getResults('report',$scope.updateTotals);
        }
    }

]);

eyeballControllers.controller('ReportYslowCtrl',['$scope','render','fieldConfig',

    function ReportYslowCtrl($scope,render,fieldConfig) {
        console.log("ReportOverviewCtrl");

        $scope.setFields(fieldConfig.yslow);

        $scope.getResults('report/yslow',$scope.updateTotals);

        $scope.format = render.format;
    }
]);

eyeballControllers.controller('ReportTimeCtrl',['$scope','render','fieldConfig',

    function ReportTimeCtrl($scope,render,fieldConfig) {
        console.log("ReportOverviewCtrl");

        $scope.setFields(fieldConfig.time);

        $scope.getResults('report/time',$scope.updateTotals);

        $scope.format = render.format;
    }
]);
