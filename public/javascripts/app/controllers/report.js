eyeballControllers.controller('ReportCtrl',['$scope','$http','$location','$timeout','$routeParams','exos','popover','tablesort','render',

    function ReportCtrl($scope,$http,$location,$timeout,$routeParams,exos,popover,tablesort,render) {
        console.log("ReportCtrl");
        $scope.results = [];
        $scope.totals = {};
        $scope.query = $routeParams;
        $scope.popoverContent = null;
        $scope.fields = [];

        var updateTotals = function() {
            for(var i=0; i<$scope.fields.length; i++) {
                if(!$scope.totals[$scope.fields[i].tool]) {
                    $scope.totals[$scope.fields[i].tool] = {};
                }
                $scope.totals[$scope.fields[i].tool][$scope.fields[i].metric] = render.totals.getTotal($scope.results,$scope.fields[i].tool,$scope.fields[i].metric);
            }
        };

        $scope.$watch('results',function(){
            // might be nicer to fire update results form here? but it needs to know what its updating...
            // can it determine this form the results object itself?
            console.log("results changed");
            updateTotals();
        });

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
            console.log($scope.results);
        };

        $scope.setFields = function(fields) {
            $scope.fields = fields;
        };

        $scope.setPopoverContent = function(data) {
            $scope.popoverContent = data;
        };

        exos.init(popover);

        tablesort.init();

    }
]);

eyeballControllers.controller('ReportOverviewCtrl',['$scope',

    function ReportOverviewCtrl($scope) {
        console.log("ReportOverviewCtrl");

        $scope.setFields([
            {tool : 'time', metric : 'lt'},
            {tool : 'yslow', metric : 'o'},
            {tool : 'dommonster', metric : 'COMPOSITE_stats'}
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