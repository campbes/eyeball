/*global eyeballApp, $, _*/

eyeballApp.factory('tablesort',['$timeout','render','exos','$filter',function($timeout,render,exos,$filter) {

    function SortableTable(id,data,$scope,cfg) {

        cfg = cfg || {};

        var table = this;
        var results = [];
        var resultsFiltered = [];
        var groupedResults = [];
        var element;
        table.page = 1;
        table.count = cfg.count || 50;
        table.pages = [];
        table.order = cfg.order || {};
        table.filter = cfg.filter || {};
        table.expanded = cfg.expanded;

        var headers = null;

        function setHeaders(){
            headers.each(function(i,obj){
                obj.className = "header";
                if(obj.getAttribute("ng-data-sort") === table.order.col) {
                    obj.className = (table.order.asc ? "header headerSortUp" : "header headerSortDown");
                }
            });
        }

        function sorter(a,b) {
            // when sorting a group, we need to use the data object or the accessObject call
            // could find any item in the results array
              if(a.data && b.data) {
                a = a.data;
                b = b.data;
              }
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

          }

        function groupAndSort(arr) {
            arr = _.groupBy(arr,"url");
            var grouped = [];
            var group;

            for(group in arr) {
                if (arr.hasOwnProperty(group)) {
                    grouped.push({
                        data : arr[group][0],
                        results : arr[group]
                    });
                }
            }
            grouped.sort(sorter);
            return grouped;
        }

        function setResults() {
            resultsFiltered = $filter('filter')(results,table.filter);
            var pageLength = Math.ceil(resultsFiltered.length/table.count);
            if(table.page > pageLength && pageLength > 0) {
                table.page = pageLength;
            }

            // do the initial group and sort to get correct mix of url sort and actual sort
            groupedResults = groupAndSort(resultsFiltered);
            // flatten the groups so that we have one array with the right ordering
            var ungroupedResults = [];
            groupedResults.forEach(function(obj){
                ungroupedResults = ungroupedResults.concat(obj.results);
            });
            // trim this array to the correct resultsetsize
            ungroupedResults = ungroupedResults.slice((table.page-1)*table.count,table.page*table.count);
            // re-group and sort the flattened array
            groupedResults = groupAndSort(ungroupedResults);
            table.results = groupedResults;

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

        table.sort = function(col,label) {

            if(table.order.col === col) {
                table.order.asc = !table.order.asc;
            } else if (col) {
                table.order.col = col;
                table.order.asc = false;
                table.order.label = label;
            }

            if(!table.order.col) {
                setResults();
                return;
            }

            results.sort(sorter);
            setResults();
        };

        table.setResults = setResults;

        table.expand = function(expand) {
            element.attr("data-expanded",expand);
        };

        table.expandLock = function(e,obj) {
            if(e.target !== obj) {
                return;
            }
            var expanded = (element.attr("data-expanded-locked") !== "true");
            element.attr("data-expanded-locked",expanded);
            table.expanded = expanded;
        };

        $timeout(function(){
            element = $("#"+id);
            headers = $("th[ng-data-sort]",element);
            setHeaders();
            exos.enable([
                {'th[ng-data-sort]' : {
                    click : {
                        fn : function(e,obj) {
                            $scope.$apply(function(){
                                table.sort(obj.getAttribute("ng-data-sort"),obj.getAttribute("ng-data-label"));
                            });
                        }
                    }
                }},
                {'th[data-expand],td[data-expand],th[data-expandable],td[data-expandable]' : {
                    mouseenter : {
                        fn : function() {
                            $scope.$apply(function(){
                                table.expand(true);
                            });
                        }
                    },
                    mouseleave : {
                        fn : function() {
                            $scope.$apply(function(){
                                table.expand(false);
                            });
                        }
                    }
                }},
                {'th[data-expand],td[data-expand],td[data-expandable]' : {
                    click : {
                        fn : function(e,obj) {
                            $scope.$apply(function(){
                                table.expandLock(e,obj);
                            });
                        }
                    }
                }}
            ]);

        },100);

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
