/*global eyeballApp, google*/

eyeballApp.factory('chart', ['render', function(render){

    function getPivotData(results,tool,field,xAxis) {

        var pivot = [['Date','A','B','C','D','E','F']];
        var xValArray = [];
        var i =null;
        var res = null;
        var xVal = null;

        for (i=0; i<results.length; i++) {
            if(results[i].metrics && results[i].metrics[tool]) {
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
