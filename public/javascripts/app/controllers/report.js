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

eyeballControllers.controller('ReportOverviewCtrl',['$scope','persist',

    function ReportOverviewCtrl($scope,persist) {
        console.log("ReportOverviewCtrl");

        $scope.setFields([
            {tool : 'time', metric : 'lt', name: 'Load time'},
            {tool : 'yslow', metric : 'o', name: 'YSlow'},
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'DomMonster'},
            {tool : 'validator', metric : 'lt', name: 'Validator'}
        ]);

        var testInfo = persist.get('testInfo') || {};
        console.log(testInfo);
        if(!testInfo.testing) {
            $scope.getResults('report',$scope.updateTotals);
        }
    }

]);

eyeballControllers.controller('ReportYslowCtrl',['$scope','render',

    function ReportOverviewCtrl($scope,render) {
        console.log("ReportOverviewCtrl");

        $scope.setFields([
            {tool : 'yslow',metric : 'o'},
            {tool : 'yslow',metric : 'w'},
            {tool : 'yslow',metric : 'w_c'},
            {tool : 'yslow',metric : 'r'},
            {tool : 'yslow',metric : 'r_c'}
        ]);

        $scope.getResults('report/yslow',$scope.updateTotals);
    }
]);
