/*global eyeballApp, $*/

eyeballApp.factory('tablesort',['$timeout','render','exos','$filter',function($timeout,render,exos,$filter) {

    function SortableTable(id,data,$scope,cfg) {

        cfg = cfg || {};

        var table = this;
        var results = [];
        var resultsFiltered = [];
        table.page = 1;
        table.count = cfg.count || 50;
        table.pages = [];
        table.order = cfg.order || {};
        table.filter = cfg.filter || {};

        var headers = null;

        function setHeaders(){
            headers.each(function(i,obj){
                obj.className = "header";
                if(obj.getAttribute("ng-data-sort") === table.order.col) {
                    obj.className = (table.order.asc ? "header headerSortUp" : "header headerSortDown");
                }
            });
        }

        function setResults() {
            resultsFiltered = $filter('filter')(results,table.filter);
            var pageLength = Math.ceil(resultsFiltered.length/table.count);
            if(table.page > pageLength && pageLength > 0) {
                table.page = pageLength;
            }
            table.results = resultsFiltered.slice((table.page-1)*table.count,table.page*table.count);
            table.pages = [];
            var i = 0;
            for(i=0;i<pageLength;i++) {
                table.pages.push(i+1);
            }
            if(headers) {
                setHeaders();
            }
        }

        table.setPage = function(p) {
            table.page = p;
            setResults();
        };

        table.setCount = function(c) {
            table.count = c;
            setResults();
        };

        table.next = function() {
            if(table.page < table.pages.length) {
                table.setPage(table.page+1);
            }
        };

        table.prev = function() {
            if(table.page > 1) {
                table.setPage(table.page-1);
            }
        };

        table.sort = function(col) {

            if(table.order.col === col) {
                table.order.asc = !table.order.asc;
            } else if (col) {
                table.order.col = col;
                table.order.asc = false;
            }

            if(!table.order.col) {
                setResults();
                return;
            }

            results.sort(function(a,b) {
                a = render.accessObject(a,table.order.col);
                b = render.accessObject(b,table.order.col);
                if(table.order.asc) {
                    if (a < b) {
                        return 1;
                    }
                    if (a > b) {
                        return -1;
                    }
                    return 0;
                }
                if (a < b) {
                    return -1;
                }
                if (a > b) {
                    return 1;
                }
                return 0;

            });
            setResults();
        };

        table.setResults = setResults;

        $timeout(function(){
            var el = $("#"+id);
            headers = $("th[ng-data-sort]",el);
            setHeaders();
        },100);

        exos.enable([{'th[ng-data-sort]' : {
            click : {
                fn : function(e,obj) {
                    $scope.$apply(function(){
                        table.sort(obj.getAttribute("ng-data-sort"));
                    });
                }
            }
        }}]);

        $scope.$watch(data,function(){
            results = [].concat($scope[data]);
            table.sort();
        });

        table.setFilter = function() {
            setResults();
        };

    }

    return {
        SortableTable : SortableTable,
        init : function(selector,cfg) {
            var tables = $(selector);
            tables.tablesorter(cfg);
            var noSort = $('tbody>tr[data-sort="false"]',tables);
            tables.bind("sortEnd",function() {
                noSort.insertBefore($('tbody>tr',tables).first());
            });
        }
    };
}]);