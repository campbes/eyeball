/*global eyeballApp,io,console,Exos,$,google*/

eyeballApp.factory('socket', ['$rootScope',function ($rootScope) {

    function connection() {
        var socket = io.connect();
        socket.socket.reconnect();

        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            },
            disconnect : function() {
                socket.disconnect();
            }
        };
    }
    return connection;
}]);

eyeballApp.service('persist',function(){

    var persist = {};

    return {
        get : function(key) {
            return persist[key];
        },
        set : function(key,data) {
            persist[key] = data;
        }
    };

});

eyeballApp.service('logger',function(){

    return {
        log : function(msg) {
            if(eyeballApp.env === "development") {
                console.log(msg);
            }
        }
    };

});

eyeballApp.factory('exos',function() {

    function popover(pop) {
        Exos.enable([
            {'td[data-type="grades"]' : {
                'mouseenter' : {
                    fn : pop.show
                },
                'mouseleave' : {
                    fn : pop.hide
                },
                'click' : {
                    fn : pop.hide
                }
            }}
        ]);

    }

    return {
        popover : popover,
        enable : Exos.enable
    };

});

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

eyeballApp.factory('popover',function(){
    return {
        show : function(e,obj) {
            var el = $(obj);
            el.popover({
                html : true,
                content : $('#popoverContent').html(),
                placement: 'left',
                container : 'body',
                trigger : 'manual'
            }).popover('show');

        },
        hide : function(e,obj) {
            $(obj).popover('destroy');
        }
    };
});

eyeballApp.factory('render',function() {

    function accessObject(obj,str) {
        if(!obj){
            return null;
        }
        var keys = str.split(".");
        var keysLength = keys.length;
        if(keys.length === 1) {
            return obj[keys[0]];
        }
        var i = null;
        for (i=0; i<keysLength; i++) {
            obj = obj[keys[i]] || obj;
        }
        return obj;
    }

    function format(val,type) {

        if(typeof val === "object") {
            return "";
        }

        switch(type) {
            case "size" :
                if(val > 1024) {
                    val = val/102.4;
                    val = Math.round(val);
                    return val/10+ " KB";
                }
                return val+ " B";
            case "time" :
                if(val > 1000) {
                    val = val/10;
                    val = Math.round(val);
                    return val/100+ " s";
                }
                return val+ " ms";
            default:
                return val;
        }
    }

    var totals = (function() {

        function getPC(results,tool,measure) {
            var fails = 0;
            var count = 0;
            var i = null;
            var res = null;
            var grade = null;

            for (i=results.length-1; i>=0; i--) {
                if(!results[i].metrics) {
                    continue;
                }
                res = results[i].metrics[tool];
                if(!res || !res.grades) {
                    continue;
                }

                grade = accessObject(res.grades,measure);

                if(!grade) {
                    continue;
                }
                count += 1;
                if(grade !== "A" && grade !== "B") {
                    fails +=1;
                }
            }
            return Math.floor(100 - (fails/(count/100)));
        }

        function getTotal(results,tool,measure) {

            var pc = getPC(results,tool,measure);
            var total = {
                score : pc,
                grade : "",
                message : "",
                className : ""
            };

            if(pc > 85) {
                total.grade = "A";
                total.message = "PASS";
                total.className = "success";
            } else if (pc <= 85) {
                total.grade = "F";
                total.message = "FAIL";
                total.className = "danger";
            }
            return total;
        }

        return {
            getTotal : getTotal
        };

    }());

    function getInfo(obj,str) {
        var val = accessObject(obj,str);

        var info = {
            lt : {
                A : "less than 2 seconds",
                B : "less than 3 seconds",
                C : "less than 4 seconds",
                D : "less than 5 seconds",
                E : "less than 6 seconds",
                F : "more than 6 seconds"
            },
            dt : {
                A : "less than 1 second",
                B : "less than 2 seconds",
                C : "less than 3 seconds",
                D : "less than 4 seconds",
                E : "less than 5 seconds",
                F : "more than 5 seconds"
            }
        };

        info.lt_u = info.lt;
        info.dt_u = info.dt;

        var ret = {
            info : info[str][val]
        };

        switch(val) {
            case 'A':
                ret.message = "User perceives page as loading almost immediately.";
                break;
            case 'B':
                ret.message = "User may notice a delay in page loading, but the overall experience is not affected.";
                break;
            case 'C':
                ret.message = "User notices a delay which may spoil the experience.";
                break;
            case 'D':
                ret.message = "User notices a significant delay which may discourage further usage.";
                break;
            case 'E':
                ret.message = "User notices a significant delay and will likely become frustrated and may give up.";
                break;
            case 'F':
                ret.message = "User will become very frustrated, give up, and likely not return";
                break;
        }

        return ret;

    }

    return {
        totals : totals,
        accessObject : accessObject,
        format : format,
        getInfo: getInfo
    };

});


eyeballApp.factory('chart', ['render', function(render){

        function getPivotData(results,tool,field,xAxis) {

            var pivot = [['Date','A','B','C','D','E','F']];
            var xValArray = [];
            var i =null;
            var res = null;
            var xVal = null;

            for (i=0; i<results.length; i++) {
                if(results[i].metrics) {
                    results[i].metrics[tool].timestamp = new Date(results[i].timestamp).toDateString();
                    results[i].metrics[tool].build = String(results[i].build);
                    res = results[i].metrics[tool];
                    if(res) {
                        xVal = (xAxis ? res[xAxis.value] : res.timestamp);
                        if(xValArray.indexOf(xVal) === -1) {
                            xValArray[xValArray.length] = xVal;
                        }
                    }
                }
            }

            var j = 0;
            var a = 0;
            var b = 0;
            var c = 0;
            var d = 0;
            var e = 0;
            var f = 0;
            var grades;

            for (j=0; j<xValArray.length; j++) {

                a = 0;
                b = 0;
                c = 0;
                d = 0;
                e = 0;
                f = 0;

                for (i=0; i<results.length; i++) {
                    if(results[i].metrics) {
                        res = results[i].metrics[tool];
                        if(res) {
                            xVal = (xAxis ? res[xAxis.value] : res.timestamp);
                            if (xVal === xValArray[j] && res.grades) {
                                grades = render.accessObject(res.grades,field);

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

        function drawChart(results,xAxis,tool,metric) {

            function sortByDate(a,b) {
                if (a.timestamp < b.timestamp) {
                    return -1;
                }
                if (a.timestamp > b.timestamp) {
                    return 1;
                }
                return 0;
            }

            results.sort(sortByDate);

            results = getPivotData(results,tool,metric,xAxis);

            var data = new google.visualization.arrayToDataTable(
                results
            );

            var view = new google.visualization.DataView(data);

            function getColumn(label,index) {
                var i = 0;
                return {
                    label : label,
                    type : 'number',
                    calc : function(dt,row) {
                        var total = 0;
                        var val = dt.getValue(row,index);
                        for(i=1; i<=6; i++) {
                            total += dt.getValue(row,i);
                        }
                        return { v: val /total, f : val.toString()};
                    }
                };
            }

            view.setColumns([0,
                getColumn('A',1),
                getColumn('B',2),
                getColumn('C',3),
                getColumn('D',4),
                getColumn('E',5),
                getColumn('F',6)
            ]);

            var container = tool + metric +"Chart";

            var el = document.getElementById(container);

            if(!el) {
                el = document.createElement("DIV");
                el.id = container;
                el.className = 'chart';
                document.getElementById('chartArea').appendChild(el);
            }

            var chart = null;

            var chartType = (results.length > 2 ? "area" : "column");

            if(chartType === 'area') {
                chart = new google.visualization.AreaChart(el);
            } else {
                chart = new google.visualization.ColumnChart(el);
            }

            var config = {
                vAxis : {
                    format : '#.##%'
                },
                areaOpacity: 1,
                series : [
                    {color: '#5cb85c'},
                    {color: '#99CC99'},
                    {color: '#FFCC66'},
                    {color: '#FF9966'},
                    {color: '#FF6633'},
                    {color: '#d9534f'}
                ],
                chartArea : {
                    height : 300
                },
                isStacked: true,
                backgroundColor: {fill:'transparent'},
                focusTarget : 'category'
            };

            chart.draw(view,config);

        }


    function drawHistoryChart(results,cols,container,handler) {
        var el = document.getElementById(container);

        if(!el) {
            el = document.createElement("DIV");
            el.id = container;
            el.className = 'chart';
            document.getElementById('chartArea').appendChild(el);
        }

        var chartData = new google.visualization.DataTable();
        var i = 0;
        for(i=0; i<cols.length;i++) {
            if(cols[i].type) {
                chartData.addColumn(cols[i]);
            } else {
                chartData.addColumn(cols[i][0],cols[i][1]);
            }
        }

        chartData.addRows(results);

        var view = new google.visualization.DataView(chartData);
        var chart = new google.visualization.LineChart(el);

        var config = {
            vAxis : {
                ticks: [
                    { v : 6, f : "A" },
                    { v : 5, f : "B" },
                    { v : 4, f : "C" },
                    { v : 3, f : "D" },
                    { v : 2, f : "E" },
                    { v : 1, f : "F" }
                ],
                viewWindow : {
                    min : 1,
                    max : 6
                }
            },
            hAxis : {
                textPosition: 'none'
            },
            chartArea : {
                //width: 800,
                height: 400
            },
            annotation : {
                '1': {style: 'line'}
            },
            /*tooltip : {
                trigger: 'none'
            } ,*/
            lineWidth : 2,
            focusTarget : 'category'
        };

        function selectHandler() {
            if(handler) {
                var sel = chart.getSelection()[0];
                handler({
                    id : view.getValue(sel.row,0)
                });
            }
        }

        google.visualization.events.addListener(chart, 'select', selectHandler);
        chart.draw(view,config);

    }

    function map(grade) {
        switch(grade) {
            case 'A' : return 6;
            case 'B' : return 5;
            case 'C' : return 4;
            case 'D' : return 3;
            case 'E' : return 2;
            case 'F' : return 1;
        }
    }

        return {
        drawPivotChart : drawChart,
        drawHistoryChart : drawHistoryChart,
        gradeMap : map
    };

}]);

eyeballApp.factory('fieldConfig',function(){

    return {
        overview : [
            {tool : 'time', metric : 'lt', name: 'Load time', format : 'time'},
            {tool : 'yslow', metric : 'o', name: 'YSlow'},
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'DomMonster'},
            {tool : 'validator', metric : 'COMPOSITE_info', name: 'Validator'}
        ],
        time : [
            {tool : 'time', metric : 'lt', name: 'Load time', format : 'time'},
            {tool : 'time', metric : 'dt', name: 'DOM load time', format : 'time'},
            {tool : 'time', metric : 'lt_u', name: 'Load time (uncached)', label : 'Load time (u/c)', format : 'time'},
            {tool : 'time', metric : 'dt_u', name: 'DOM load time (uncached)', label: 'DOM time (u/c)', format : 'time'}
        ],
        yslow : [
            {tool : 'yslow',metric : 'o', name : 'Overall'},
            {tool : 'yslow',metric : 'w', name : 'Page size', format : 'size', label : 'Size'},
            {tool : 'yslow',metric : 'w_c', name : 'Page size (cached)', format : 'size', label:'Size (c)'},
            {tool : 'yslow',metric : 'r', name : 'HTTP requests', label: 'Requests'},
            {tool : 'yslow',metric : 'r_c', name : 'HTTP requests (cached)', label: 'Requests (c)'}
        ] ,
        dommonster : [
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'Overall'},
            {tool : 'dommonster', metric : 'stats.elements', name : 'Elements'},
            {tool : 'dommonster', metric : 'stats.nodes', name : 'Nodes'},
            {tool : 'dommonster', metric : 'stats.text nodes', name : 'Text nodes', label:'Text'},
            {tool : 'dommonster', metric : 'stats.text node size', name : 'Text node size', label:'Text size'},
            {tool : 'dommonster', metric : 'stats.content percentage', name : 'Content Percentage', label:'Content'},
            {tool : 'dommonster', metric : 'stats.average nesting depth', name : 'Nesting'},
            {tool : 'dommonster', metric : 'stats.serialized DOM size', name : 'DOM size'}
        ],
        validator : [
            {tool : 'validator', metric : 'COMPOSITE_info', name : 'Overall'},
            {tool : 'validator', metric : 'info.errors', name : 'Errors'},
            {tool : 'validator', metric : 'info.warnings', name : 'Warnings'}
        ],
        history : [
            {tool : 'overview', name : 'Overview'},
            {tool : 'time', metric : 'lt', name: 'Load time', format : 'time'},
            {tool : 'yslow', metric : 'o', name: 'YSlow'},
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'DomMonster'},
            {tool : 'validator', metric : 'COMPOSITE_info', name: 'Validator'}
        ]
    };

});
