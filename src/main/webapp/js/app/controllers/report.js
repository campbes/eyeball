/*global eyeballControllers, _*/

eyeballControllers.controller('ReportCtrl',['settings','$scope','$http','$location','$timeout','$routeParams','utils','popover','tablesort','render','chart','persist','logger','config',

    function ReportCtrl(settings,$scope,$http,$location,$timeout,$routeParams,utils,popover,tablesort,render,chart,persist,logger,config) {
        logger.log("ReportCtrl");
        $scope.setPage("report");
        config = config.data.report;

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

        $scope.charts = [];

        $scope.expandedUrls = [];

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
                col : persist.get('resultsTable.order.col') || "timestamp",
                asc : persist.get('resultsTable.order.asc') || true,
                label : persist.get('resultsTable.order.label') || "Date"
            },
            expanded : persist.get('resultsTable.expanded')
        });

        function setupChart(i) {
            var ch = $scope.charts[i];
            logger.log(ch.tool+" chart changed");
            $timeout(function(){
                chart.drawPivotChart($scope.results,$scope.resultsTable.order,ch.tool,ch.metric);
            },500);
        }

        var queryString = ($location.url().indexOf("?") > -1 ? $location.url().split("?")[1] : "");

        $scope.queryString = queryString;
        persist.set('reportFilter',queryString);

        $scope.getResults = function(url) {
            $scope.busy = true;
            $http({
                url: url + (url.indexOf('?') === -1 ? '?' : '&')+queryString,
                method: "GET"
            }).success(function(results) {
                $scope.results = results;
                var expanded = persist.get("expandedUrls") || [];
                expanded.forEach(function(obj,i) {
                    $scope.expandResultsGroup({url : obj});
                });
                $scope.busy = false;
            });
        };

        $scope.pushResults = function(result) {
            $scope.results = $scope.results.concat([result]);
        };

        function setupCharts() {
            if($scope.reportView !== "chart") {
                return;
            }
            var i = 0;
            for(i=0; i<$scope.fields.length; i++) {
                $scope.charts[i] = {
                    tool : $scope.fields[i].tool,
                    metric : $scope.fields[i].metric,
                    name : $scope.fields[i].name,
                    xAxis : $scope.resultsTable.order.col,
                    asc : $scope.resultsTable.order.asc
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
                setupCharts();
            }
        };

        $scope.filter = function() {
            $timeout(function(){
                $location.path($scope.path).search($scope.filterParams);
            },500);
        };

        $scope.filterById = function() {
            $scope.filterParams.id = ($scope.filterParams.id ? "" : $scope.starredRecords.toString());
            $scope.filter();
        };

        $scope.compare = function() {
            $location.path('compare/:'+$scope.starredRecords.toString());
        };

        $scope.deStar = function() {
            $scope.starredRecords = [];
        };

        var textFilterTimer;

        $scope.textFilter = function() {
            if(textFilterTimer) {
                clearTimeout(textFilterTimer);
            }
            textFilterTimer = setTimeout($scope.filter,500);
        };

        utils.popover(popover);

        $scope.encodeQuery = function(val) {
            return encodeURIComponent(val);
        };

        $scope.$watch("resultsTable.count",function(){
            logger.log("results table count changed");
            persist.set("resultsCount",$scope.resultsTable.count);
            setupCharts();
        });
        $scope.$watch("resultsTable.order.col",function(){
            logger.log("results table order (col) changed");
            persist.set("resultsTable.order.col",$scope.resultsTable.order.col);
            setupCharts();
        });
        $scope.$watch("resultsTable.order.asc",function(){
            logger.log("results table order (asc) changed");
            persist.set("resultsTable.order.asc",$scope.resultsTable.order.asc);
            setupCharts();
        });

        $scope.$watch("resultsTable.expanded",function(){
            logger.log("results table expanded");
            persist.set("resultsTable.expanded",$scope.resultsTable.expanded);
        });

        $scope.$watch('results',function(){
            logger.log("results changed");
            updateTotals();
            setupCharts();
        });

        $scope.expandResultsGroup = function(obj) {
            var url = '/v'+settings.apiVersion+'/results';
            function urlMatch(o) {
                return o.url === obj.url || o === obj.url;
            }

            var expanded = _.find($scope.expandedUrls,urlMatch);
            if(expanded) {
                url = '/v'+settings.apiVersion+'/results/latest';
            } else {
                obj.busy = true;
            }
            url += '?url='+encodeURIComponent(obj.url) + '&' + queryString.replace(/&url(\=[^&]*)?(?=&|$)|^url(\=[^&]*)?(&|$)/,'');

            $http({
                url: url,
                method: "GET"
            }).success(function(results) {
                _.remove($scope.results,urlMatch);
                if(expanded) {
                    _.remove($scope.expandedUrls,urlMatch);
                } else {
                    $scope.expandedUrls.push(obj.url);
                }
                persist.set("expandedUrls",$scope.expandedUrls);
                $scope.results = $scope.results.concat(results);
                obj.busy = false;
            });
        };

        $scope.starredRecords = persist.get("starredRecords") || [];

        $scope.starRecord = function(id) {
            if($scope.starredRecords.indexOf(id) === -1) {
                $scope.starredRecords.push(id);
            } else {
                $scope.starredRecords.splice($scope.starredRecords.indexOf(id),1);
            }
            persist.set("starredRecords",$scope.starredRecords);
        };


    }
]);

eyeballControllers.controller('ReportOverviewCtrl',['settings','$scope','persist',

    function ReportOverviewCtrl(settings,$scope,persist) {
        var testInfo = persist.get('testInfo') || {};
        if(!testInfo.testing) {
            $scope.getResults('/v'+settings.apiVersion+'/results/latest',$scope.updateTotals);
        }
    }

]);

eyeballControllers.controller('ReportStandardCtrl',['settings','$scope',

    function ReportStandardCtrl(settings,$scope) {
        $scope.getResults('/v'+settings.apiVersion+'/results/latest?fields=metrics.'+$scope.report,$scope.updateTotals);
    }
]);