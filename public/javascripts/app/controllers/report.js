eyeballControllers.controller('ReportCtrl',['$scope','$http','$location','$timeout','$routeParams','exos','popover','tablesort','render','chart',

    function ReportCtrl($scope,$http,$location,$timeout,$routeParams,exos,popover,tablesort,render,chart) {
        console.log("ReportCtrl");

        $scope.results = [];
        $scope.totals = {};
        $scope.query = $routeParams;
        $scope.popoverContent = null;
        $scope.fields = [];
        $scope.reportView = '';
        $scope.charts={
            options : [
                {name : "Date", value : "timestamp"},
                {name : "Build", value : "build"}
            ],
            time : {},
            yslow : {},
            dommonster : {}
        };
        $scope.charts.time.xAxis = $scope.charts.options[0];
        $scope.charts.yslow.xAxis = $scope.charts.options[0];
        $scope.charts.dommonster.xAxis = $scope.charts.options[0];

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

        function setChartWatch(tool,metric) {
            $scope.$watch('charts.'+tool+'.xAxis',function(){
                if($scope.reportView === 'chart') {
                    console.log(tool+" chart changed");
                    $timeout(function(){
                        chart.drawPivotChart($scope.results,$scope.charts[tool].xAxis,tool,metric);
                    },1000);
                }
            });
        }

        var queryString = ($location.url().indexOf("?") > -1 ? $location.url().split("?")[1] : "");

        $scope.queryString = queryString;

        $scope.getResults = function(url) {
            $http({
                url: url + '?'+queryString,
                method: "GET"
            }).success(function(results) {
                    $scope.results = results;
                });
        };

        $scope.pushResults = function(result) {
            $scope.results = $scope.results.concat([result]);
        };

        $scope.setFields = function(fields) {
            $scope.fields = fields;
            for(var i=0; i<$scope.fields.length; i++) {
                setChartWatch($scope.fields[i].tool,$scope.fields[i].metric);
            }
        };

        $scope.setPopoverContent = function(data) {
            $scope.popoverContent = data;
        };

        $scope.setReportView = function(view) {
            $scope.reportView = view;
            if(view === 'chart') {
                $timeout(function(){
                    for(var i=0; i<$scope.fields.length; i++) {
                        var tool = $scope.fields[i].tool;
                        var metric = $scope.fields[i].metric;
                        chart.drawPivotChart($scope.results,$scope.charts[tool].xAxis,tool,metric);
                    }
                },100)
            }
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

eyeballControllers.controller('ReportOverviewCtrl',['$scope',

    function ReportOverviewCtrl($scope) {
        console.log("ReportOverviewCtrl");

        $scope.setFields([
            {tool : 'time', metric : 'lt', name: 'Load time'},
            {tool : 'yslow', metric : 'o', name: 'YSlow'},
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'DomMonster'}
        ]);

        $scope.getResults('report',$scope.updateTotals);

    }

]);

eyeballControllers.controller('ReportYslowCtrl',['$scope','render',

    function ReportOverviewCtrl($scope,render) {
        console.log("ReportOverviewCtrl");

        $scope.setFields([
            {tool : 'yslow',metric : 'o'},
            {tool : 'yslow',metric : 'w'},
            {tool : 'yslow',metric : 'w_c'},
            {tool : 'yslow',metric : 'r'}
        ]);

        $scope.getResults('report/yslow',$scope.updateTotals);
    }
]);
