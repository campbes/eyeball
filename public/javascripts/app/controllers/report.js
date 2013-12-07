eyeballControllers.controller('ReportCtrl',['$scope','$http','$location','$timeout','$routeParams','exos','popover','tablesort','render','chart','persist',

    function ReportCtrl($scope,$http,$location,$timeout,$routeParams,exos,popover,tablesort,render,chart,persist) {
        console.log("ReportCtrl");
        $scope.format = render.format;
        $scope.getVal = render.accessObject;
        $scope.results = [];
        $scope.totals = {};
        $scope.query = $routeParams;
        $scope.filterParams = {};
        $scope.popoverContent = null;
        $scope.fields = [];
        $scope.reportView = persist.get('reportView') || 'table';

        $scope.chartOptions = [
            {name : "Date", value : "timestamp"},
            {name : "Test ID", value : "build"}
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

        $scope.resultsTable = new tablesort.SortableTable('results','results',$scope,{
            count : persist.get('resultsTable.count'),
            order : {
                col : persist.get('resultsTable.order.col'),
                asc : persist.get('resultsTable.order.asc')
            }
        });

        $scope.$watch("resultsTable.count",function(){
            console.log("results table count changed");
            persist.set("resultsCount",$scope.resultsTable.count);
        });
        $scope.$watch("resultsTable.order.col",function(){
            console.log("results table order (col) changed");
            persist.set("resultsTable.order.col",$scope.resultsTable.order.col);
        });
        $scope.$watch("resultsTable.order.asc",function(){
            console.log("results table order (asc) changed");
            persist.set("resultsTable.order.asc",$scope.resultsTable.order.asc);
        });

        $scope.$watch('results',function(){
            console.log("results changed");
            updateTotals();
            setupCharts();
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
            for(var i=0; i<$scope.fields.length; i++) {
                $scope.charts[i] = {
                    tool : $scope.fields[i].tool,
                    metric : $scope.fields[i].metric,
                    name : $scope.fields[i].name,
                    xAxis : $scope.chartOptions[0]
                };
                setupChart(i);
            }
        }

        $scope.setFields = function(fields) {
            $scope.fields = fields;
            setupCharts();
        };

        $scope.setPopoverContent = function(data) {
            $scope.popoverContent = data;
        };

        $scope.setReportView = function(view) {
            $scope.reportView = view;
            persist.set('reportView',$scope.reportView);
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

        $scope.$on("quickFilter",function(sc,url) {
            $scope.filterParams = {
                url : url
            };
            $scope.filter();
        });

        exos.popover(popover);

        $scope.encodeQuery = function(val) {
            return encodeURIComponent(val);
        }

    }
]);

eyeballControllers.controller('ReportOverviewCtrl',['$scope','persist','fieldConfig',

    function ReportOverviewCtrl($scope,persist,fieldConfig) {
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
        $scope.setFields(fieldConfig.yslow);
        $scope.getResults('report/yslow',$scope.updateTotals);
    }
]);

eyeballControllers.controller('ReportTimeCtrl',['$scope','render','fieldConfig',

    function ReportTimeCtrl($scope,render,fieldConfig) {
        $scope.setFields(fieldConfig.time);
        $scope.getResults('report/time',$scope.updateTotals);
    }
]);

eyeballControllers.controller('ReportDommonsterCtrl',['$scope','render','fieldConfig',

    function ReportDommonsterCtrl($scope,render,fieldConfig) {
        $scope.setFields(fieldConfig.dommonster);
        $scope.getResults('report/dommonster',$scope.updateTotals);
    }
]);

eyeballControllers.controller('ReportValidatorCtrl',['$scope','render','fieldConfig',

    function ReportValidatorCtrl($scope,render,fieldConfig) {
        $scope.setFields(fieldConfig.validator);
        $scope.getResults('report/validator',$scope.updateTotals);
    }
]);