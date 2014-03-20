/*global eyeballControllers*/

eyeballControllers.controller('ReportCtrl',['$scope','$http','$location','$timeout','$routeParams','utils','popover','tablesort','render','chart','persist','logger','config',

    function ReportCtrl($scope,$http,$location,$timeout,$routeParams,utils,popover,tablesort,render,chart,persist,logger,config) {
        logger.log("ReportCtrl");
        $scope.setPage("report");

        $scope.format = render.format;
        $scope.getVal = render.accessObject;
        $scope.results = [];
        $scope.totals = {};
        $scope.query = $routeParams;
        $scope.filterParams = {};
        $scope.popoverContent = null;
        $scope.fields = [];
        $scope.reportView = persist.get('reportView') || 'table';
        $scope.path = $location.path();
        $scope.fieldConfig = config.fields;
        $scope.report = $scope.path.substr($scope.path.lastIndexOf('/')+1);
        $scope.fields = config.fields[$scope.report].items;

        $scope.chartOptions = [
            {name : "Date", value : "timestamp"},
            {name : "Test ID", value : "build"}
        ];
        $scope.charts = [];

        var qParam;
        for(qParam in $scope.query) {
            if($scope.query.hasOwnProperty(qParam)) {
                $scope.filterParams[qParam] = $scope.query[qParam];
            }
        }

        var testInfo = persist.get('testInfo') || {};
        $scope.busy =  testInfo.testing;

        $scope.$on('testComplete',function() {
            $scope.busy = false;
        });

        var updateTotals = function() {
            var i = 0;
            for(i=0; i<$scope.fields.length; i++) {
                if(!$scope.totals[$scope.fields[i].tool]) {
                    $scope.totals[$scope.fields[i].tool] = {};
                }
                $scope.totals[$scope.fields[i].tool][$scope.fields[i].metric] = render.totals.getTotal($scope.results,$scope.fields[i].tool,$scope.fields[i].metric);
            }
        };

        $scope.resultsTable = new tablesort.SortableTable('results','results',$scope,{
            count : persist.get('resultsTable.count'),
            order : {
                col : persist.get('resultsTable.order.col'),
                asc : persist.get('resultsTable.order.asc')
            }
        });

        function setupChart(i) {
            var ch = $scope.charts[i];
            $scope.$watch('charts['+i+'].xAxis',function(){
                if($scope.reportView === 'chart') {
                    logger.log(ch.tool+" chart changed");
                    $timeout(function(){
                        chart.drawPivotChart($scope.results,ch.xAxis,ch.tool,ch.metric);
                    },1000);
                }
            });
        }

        var queryString = ($location.url().indexOf("?") > -1 ? $location.url().split("?")[1] : "");

        $scope.queryString = queryString;
        persist.set('reportFilter',queryString);

        $scope.getResults = function(url) {
            $scope.busy = true;
            $http({
                url: url + '?'+queryString,
                method: "GET"
            }).success(function(results) {
                    $scope.results = results;
                    $scope.busy = false;
                });
        };

        $scope.pushResults = function(result) {
            $scope.results = $scope.results.concat([result]);
        };

        function setupCharts() {
            var i = 0;
            for(i=0; i<$scope.fields.length; i++) {
                $scope.charts[i] = {
                    tool : $scope.fields[i].tool,
                    metric : $scope.fields[i].metric,
                    name : $scope.fields[i].name,
                    xAxis : $scope.chartOptions[0]
                };
                setupChart(i);
            }
        }

        $scope.setPopoverContent = function(data) {
            $scope.popoverContent = data;
        };

        $scope.setReportView = function(view) {
            $scope.reportView = view;
            persist.set('reportView',$scope.reportView);
            if(view === 'chart') {
                $timeout(function(){
                    var i = 0;
                    var ch;
                    for(i=0; i<$scope.charts.length; i++) {
                        ch = $scope.charts[i];
                        chart.drawPivotChart($scope.results,ch.xAxis,ch.tool,ch.metric);
                    }
                },100);
            }
        };

        $scope.filter = function() {
            $timeout(function(){
                $location.path($scope.path).search($scope.filterParams);
            },500);
        };

        utils.popover(popover);

        $scope.encodeQuery = function(val) {
            return encodeURIComponent(val);
        };

        $scope.$watch("resultsTable.count",function(){
            logger.log("results table count changed");
            persist.set("resultsCount",$scope.resultsTable.count);
        });
        $scope.$watch("resultsTable.order.col",function(){
            logger.log("results table order (col) changed");
            persist.set("resultsTable.order.col",$scope.resultsTable.order.col);
        });
        $scope.$watch("resultsTable.order.asc",function(){
            logger.log("results table order (asc) changed");
            persist.set("resultsTable.order.asc",$scope.resultsTable.order.asc);
        });

        $scope.$watch('results',function(){
            logger.log("results changed");
            updateTotals();
            setupCharts();
        });

    }
]);

eyeballControllers.controller('ReportOverviewCtrl',['$scope','persist',

    function ReportOverviewCtrl($scope,persist) {
        var testInfo = persist.get('testInfo') || {};
        if(!testInfo.testing) {
            $scope.getResults('report',$scope.updateTotals);
        }
    }

]);

eyeballControllers.controller('ReportStandardCtrl',['$scope',

    function ReportStandardCtrl($scope) {
        $scope.getResults('report/'+$scope.report,$scope.updateTotals);
    }
]);