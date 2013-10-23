eyeballControllers.controller('ReportCtrl',['$scope','$http','$location','$timeout','$routeParams','exos','popover','tablesort',

    function ReportCtrl($scope,$http,$location,$timeout,$routeParams,exos,popover,tablesort) {
        console.log("ReportCtrl");
        $scope.results = [];
        $scope.totals = {};
        $scope.query = $routeParams;
        $scope.popoverContent = null;

        var queryString = ($location.url().indexOf("?") > -1 ? $location.url().split("?")[1] : "");

        $scope.queryString = queryString;

        $scope.getResults = function(url,updateTotals) {
            $http({
                url: url + '?'+queryString,
                method: "GET"
            }).success(function(results) {
                    $scope.results = results;
                    updateTotals();
                });
        };

        $scope.setPopoverContent = function(data) {
            $scope.popoverContent = data;
        };

        exos.init(popover);

        tablesort.init();

    }
]);

eyeballControllers.controller('ReportOverviewCtrl',['$scope','render',

    function ReportOverviewCtrl($scope,render) {
        console.log("ReportOverviewCtrl");

        $scope.getResults('report', function() {
            $scope.totals = {
                time : render.totals.getTotal($scope.results,'yslow','lt'),
                yslow : {
                    o : render.totals.getTotal($scope.results,'yslow','o')
                },
                dommonster : {
                    COMPOSITE_stats : render.totals.getTotal($scope.results,'dommonster','COMPOSITE_stats')
                }
            };
        });
    }
]);

eyeballControllers.controller('ReportYslowCtrl',['$scope','render',

    function ReportOverviewCtrl($scope,render) {
        console.log("ReportOverviewCtrl");

        $scope.getResults('report/yslow', function() {
            $scope.totals = {
                yslow : {
                    o : render.totals.getTotal($scope.results,'yslow','o'),
                    w : render.totals.getTotal($scope.results,'yslow','w'),
                    w_c : render.totals.getTotal($scope.results,'yslow','w_c'),
                    r : render.totals.getTotal($scope.results,'yslow','r')
                }
            };
        });
    }
]);