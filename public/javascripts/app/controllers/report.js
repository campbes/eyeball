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
            getChartData($scope.results,render);
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


function getPivotData(results,tool,field,render) {

    var xAxis = null;
    var pivot = [['Date','A','B','C','D','E','F']];
    var xValArray = [];
    var i =null;
    var res = null;
    var xVal = null;

    for (i=results.length-1; i>=0; i--) {
        if(results[i].metrics) {
            res = results[i].metrics[tool];
            if(res) {
                xVal = (xAxis ? res[xAxis] : res.tool);
                if(xValArray.indexOf(xVal) === -1) {
                    xValArray[xValArray.length] = xVal;
                }
            }
        }
    }

    for (var j=0; j<xValArray.length; j++) {
        var a = 0;
        var b = 0;
        var c = 0;
        var d = 0;
        var e = 0;
        var f = 0;
        for (i=results.length-1; i>=0; i--) {
            if(results[i].metrics) {
                res = results[i].metrics[tool];
                if(res) {
                    xVal = (xAxis ? res[xAxis] : res.tool);
                    if (xVal === xValArray[j] && res.grades) {
                        var grades = render.accessObject(res.grades,field);

                        switch(grades) {
                            case "A": a += 1; break;
                            case "B": b += 1; break;
                            case "C": c += 1; break;
                            case "D": d += 1; break;
                            case "E": e += 1; break;
                            case "F": f += 1; break;
                        }
                    }
                }
            }
        }
        pivot[pivot.length] = [xValArray[j],a,b,c,d,e,f];
    }

    return pivot;
}

function getChartData(results,render) {
    var chartData = {
        yslow : {
            o : getPivotData(results,'yslow','o',render),
            lt : getPivotData(results,'yslow','lt',render),
            w : getPivotData(results,'yslow','w',render),
            r : getPivotData(results,'yslow','r',render),
            inline : getPivotData(results,'yslow','g.yminify.score',render)
        }/*,
         dommonster : {
         o : getPivotData(results,'dommonster','COMPOSITE_stats'),
         e : getPivotData(results,'dommonster','stats.elements'),
         n : getPivotData('dommonster','stats.nodecount'),
         t : getPivotData('dommonster','stats.textnodes'),
         ts : getPivotData('dommonster','stats.textnodessize'),
         c : getPivotData('dommonster','stats.contentpercent'),
         a : getPivotData('dommonster','stats.average'),
         d : getPivotData('dommonster','stats.domsize')
         },
         validator : {
         o : getPivotData('validator','COMPOSITE_info'),
         e : getPivotData('validator','info.errors'),
         w : getPivotData('validator','info.warnings')
         } */
    };

    drawChart(chartData.yslow.o,'yslow',{title : 'YSlow'});
}


function drawChart(results,container,options) {
    var data = new google.visualization.arrayToDataTable(
        results
    );

    var view = new google.visualization.DataView(data);

    function getColumn(label,index) {
        return {
            label : label,
            type : 'number',
            calc : function(dt,row) {
                var total = 0;
                var val = dt.getValue(row,index);
                for(var i=1; i<=6; i++) {
                    total += dt.getValue(row,i);
                }
                return { v: val /total, f : val.toString()};
            }
        }
    }

    view.setColumns([0,
        getColumn('A',1),
        getColumn('B',2),
        getColumn('C',3),
        getColumn('D',4),
        getColumn('E',5),
        getColumn('F',6)
    ]);

    var el = document.getElementById(container);

    if(!el) {
        el = document.createElement("DIV");
        el.id = container;
        el.className = 'chart';
        document.getElementById('chartArea').appendChild(el);
    }

    var chart = null;

    var query = {};
    location.href.replace(
        new RegExp("([^?=&]+)(=([^&#]*))?", "g"),
        function($0, $1, $2, $3) { query[$1] = $3; }
    );

    var chartType = query.chartType || 'column';

    if(chartType === 'area') {
        chart = new google.visualization.AreaChart(document.getElementById(container));
    } else {
        chart = new google.visualization.ColumnChart(document.getElementById(container));
    }

    var config = {
        vAxis : {
            format : '#.##%'
        },
        areaOpacity: 0.8,
        series : [
            {color: '#00CC00'},
            {color: '#9ACD32'},
            {color: '#FFFF00'},
            {color: '#FF8C00'},
            {color: '#FF4500'},
            {color: '#CC0000'}
        ],
        isStacked: true,
        backgroundColor: {fill:'transparent'}
    };

    if(options) {
        for(var i in options) {
            if(options.hasOwnProperty(i)) {
                config[i] = options[i];
            }
        }
    }

    chart.draw(view,config);

}

google.load('visualization', '1.0', {'packages':['corechart']});
