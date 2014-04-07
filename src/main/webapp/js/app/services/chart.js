/*global eyeballApp, google*/

eyeballApp.factory('chart', ['render', function(render){

    function getPivotData(results,tool,field,xAxis) {

        var pivot = [['Date','A','B','C','D','E','F']];
        var xValArray = [];
        var i =null;
        var res = null;
        var xVal = null;
        xAxis = xAxis || "timestamp";

        for (i=0; i<results.length; i++) {
            if(results[i].metrics && results[i].metrics[tool]) {
                res = results[i].metrics[tool];
                results[i].timestamp = new Date(results[i].timestamp).toDateString();

                if(res) {
                    xVal = render.accessObject(results[i],xAxis);
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
                        xVal = render.accessObject(results[i],xAxis);
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

    function drawChart(results,order,tool,metric) {

        function sorter(a,b) {

            var aVal = render.accessObject(a,order.col);
            var bVal = render.accessObject(b,order.col);

            if (aVal < bVal) {
                return (order.asc ? 1 : -1);
            }
            if (aVal > bVal) {
                return (order.asc ? -1 : 1);
            }
            return 0;
        }

        results.sort(sorter);

        results = getPivotData(results,tool,metric,order.col);

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
            getColumn('F',6),
            getColumn('E',5),
            getColumn('D',4),
            getColumn('C',3),
            getColumn('B',2),
            getColumn('A',1)
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
            hAxis : {
                title : order.label
            },
            areaOpacity: 1,
            series : [
                {color: '#d9534f'},
                {color: '#FF6633'},
                {color: '#FF9966'},
                {color: '#FFCC66'},
                {color: '#99CC99'},
                {color: '#5cb85c'}
            ],
            chartArea : {
                height : 350
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
        var chart = new google.visualization.AreaChart(el);

        var config = {
            vAxis : {
                ticks: [
                    { v : 6, f : "A" },
                    { v : 5, f : "B" },
                    { v : 4, f : "C" },
                    { v : 3, f : "D" },
                    { v : 2, f : "E" },
                    { v : 1, f : "F" },
                    { v : 0, f : "None"}
                ],
                viewWindow : {
                    min : 0,
                    max : 6.5
                },
                minorGridlines : {
                    count : 1,
                    color : "#CCC"
                },
                gridlines : {
                    color : "#FFF"
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
            focusTarget : 'category',
            areaOpacity : 0.2
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

    function map(grade,pos,total) {
        var offset = (pos+1)/(total+1) - 0.5;
        switch(grade) {
            case 'A' : return 6 - offset;
            case 'B' : return 5 - offset;
            case 'C' : return 4 - offset;
            case 'D' : return 3 - offset;
            case 'E' : return 2 - offset;
            case 'F' : return 1 - offset;
            default : return 0;
        }
    }

    return {
        drawPivotChart : drawChart,
        drawHistoryChart : drawHistoryChart,
        gradeMap : map
    };

}]);
