var Harpy = function() {

    function buildTimeline(obj,startTime) {

        var start = new Date(obj.startedDateTime) - startTime;

        var str = "";
        str += "<div class='blocked' data-start='"+start+"' data-time='"+obj.timings.blocked+"'></div>";
        str += "<div class='dns' data-time='"+obj.timings.dns+"'></div>";
        str += "<div class='connect' data-time='"+obj.timings.connect+"'></div>";
        str += "<div class='send' data-time='"+obj.timings.send+"'></div>";
        str += "<div class='wait' data-time='"+obj.timings.wait+"'></div>";
        str += "<div class='receive' data-time='"+obj.timings.receive+"'></div>";
        return str;
    }

    function getMimetype(type) {
        if(type.indexOf("image") !== -1) {
            return "image";
        } else if(type.indexOf("html") !== -1) {
            return "html";
        } else if(type.indexOf("javascript") !== -1) {
            return "js";
        } else if(type.indexOf("css") !== -1) {
            return "css";
        } else if(type.indexOf("text") !== -1) {
            return "text";
        }
        return "other";
    }

    function format(val,type) {
        switch(type) {
            case "size" :
                if(val > 1024) {
                    val = val/102.4;
                    val = Math.round(val);
                    return val/10+ " KB";
                }
                return val+ " B";
                break;
            case "time" :
                if(val > 1000) {
                    val = val/10;
                    val = Math.round(val);
                    return val/100+ " s";
                }
                return val+ " ms";

        }
    }

    function buildMarker(time) {
        var str = "<div class='loadMarker' ";
        str += "data-dom='"+(time.onContentLoad || time.onLoad)+"' "
        str += "data-page='"+time.onLoad+"'"
        str += "></div>";
        return str;
    }

    function Viewer(har,options) {
        var viewer = this;
        var entryCache = {};
        var el = null;
        options = options || {};
        var output = "";
        har = JSON.parse(har);

        var time = har.log.pages[0].pageTimings;
        time.total = time.onLoad;

        var startTime = new Date(har.log.pages[0].startedDateTime);
        var stats = {
            time : {
                blocked : 0,
                dns : 0,
                connect : 0,
                send : 0,
                wait : 0,
                receive : 0
            },
            type : {
                image : 0,
                html : 0,
                js : 0,
                css : 0,
                text : 0,
                other : 0
            },
            uncached : {
                image : 0,
                html : 0,
                js : 0,
                css : 0,
                text : 0,
                other : 0
            },
            size : {
                cache : 0,
                download : 0
            }
        };

        output += "<thead><tr>";
        output += "<th>Req.</th>";
        output += "<th>Meth.</th>";
        output += "<th>URL</th>";
        output += "<th>Status</th>";
        output += "<th>Type</th>";
        output += "<th>Size</th>";
        output += "<th class='timeline'>"+buildMarker(time)+"</th>";
       //output += "<th>Time</th>";
        output += "</tr></thead><tbody>";

        for(var i=0; i<har.log.entries.length; i++) {
            var entry = har.log.entries[i];
            entryCache[i] = entry;
            var url = entry.request.url;
            var type = getMimetype(entry.response.content.mimeType);

            var endTime = new Date(entry.startedDateTime).getTime() + entry.time;
            if(endTime > startTime.getTime() + time.total) {
                time.total = endTime - startTime;
            }

            for(var x in entry.timings) {
                if(entry.timings.hasOwnProperty(x)) {
                    if( entry.timings[x] > 0) {
                        stats.time[x] += entry.timings[x];
                    }
                }
            }

            stats.type[type] += entry.response.bodySize;
            stats.uncached[type] += entry.response.bodySize;
            stats.size.download += entry.response.bodySize;

            if(i>0) {
                url = url.replace(har.log.entries[0].request.url,"");
            }
            output += "<tr data-id='"+i+"' class='"+type+(entry.response.status === '(cache)' ? ' cache' : '')+"'>";
            output += "<td>"+(i+1)+"</td>"
            output += "<td>"+entry.request.method+"</td>"
            output += "<td title='"+url+"' class='url'>"+url.substr(0,30)+(url.length > 30 ? "..." : "")+"</td>";
            output += "<td title='"+entry.response.status+" "+entry.response.statusText+"'>"+entry.response.status+"</td>";
            output += "<td title='"+entry.response.content.mimeType+"'>"+type+"</td>"
            if(entry.cache.hasOwnProperty('afterRequest')) {
                output += "<td>"+format(entry.response.content.size,'size')+"</td>";
                stats.size.cache += entry.response.content.size;
                stats.type[type] += entry.response.content.size;
            } else {
                output += "<td>"+format(entry.response.bodySize,'size')+"</td>";
            }
            output += "<td title='"+format(entry.time,'time')+"'>";
            output += buildTimeline(entry,startTime)+"</td>";
            output += "</tr>";
        }
        output += "</tbody><tfoot><tr class='total'>";
        output += "<td>"+har.log.entries.length+"</td>";
        output += "<td></td><td></td><td></td><td></td><td>"+format((stats.size.download+stats.size.cache),'size')+"</td>";
        output += "<td> ("+format(stats.size.cache,'size')+" from cache)<span title='DOM: "+format(time.onContentLoad || time.onLoad,'time')+", Page: "+format(time.onLoad,'time')+"'>"+format(time.total,'time')+"</span></td>";
        //output += "<td title='DOM: "+format(time.onContentLoad || time.onLoad,'time')+", Page: "+format(time.onLoad,'time')+"'>"+format(time.total,'time')+"</td>";
        output += "</tr></tfoot>";

        this.showInfo = function(obj) {
            var id = obj.getAttribute("data-id");
            var entry = entryCache[id];
            if(entry.info) {
                entry.info.style.display = (entry.info.style.display === "none" ? "table-row" : "none");
                resize();
                return;
            }
            var infoRow = document.createElement("TR");
            var info = "<td></td><td class='info' colspan='6'>";
            info += "<a href='"+entry.request.url+"' target='_blank'><strong>"+entry.request.url+"</strong></a>";
            info += "<br/>"+entry.response.content.mimeType;
            info += "<hr/>";
            info += "<strong>Request headers</strong>";
            info += "<table>";
            for (var i=0; i<entry.request.headers.length; i++){
                info += "<tr><td>"+entry.request.headers[i].name+"</td>";
                info += "<td>"+entry.request.headers[i].value+"</td></tr>";
            }
            info += "</table>";
            info += "<hr/>";
            info += "<strong>Response headers</strong>";
            info += "<table>";
            for (var i=0; i<entry.response.headers.length; i++){
                info += "<tr><td>"+entry.response.headers[i].name+"</td>";
                info += "<td>"+entry.response.headers[i].value+"</td></tr>";
            }
            info += "</table>";
            info += "</td>";
            infoRow.innerHTML = info;

            $(obj).after(infoRow);
            entry.info = infoRow;
            resize();
        }

        function resize() {
            var timeline = $('#'+el+' th.timeline');
            var unit = timeline.width()/time.total;
            var times = $('#'+el+' table.harpy div');
            var marker = $('#'+el+' table.harpy div.loadMarker');

            times.each(function() {
                if(this.hasAttribute('data-start')) {
                    this.style.marginLeft = Number(this.getAttribute('data-start'))*unit + "px";
                }
                if(this.hasAttribute('data-time')) {
                    this.style.width = Number(this.getAttribute('data-time'))*unit + "px";
                }
            });

            marker.each(function(){
                var left = 0;
                var width = 0;
                if(this.hasAttribute('data-dom')) {
                    left = Number(this.getAttribute('data-dom'))*unit;
                }
                if(this.hasAttribute('data-page')) {
                    width = Number(this.getAttribute('data-page'))*unit - left;
                }
                this.style.marginLeft = left + "px";
                this.style.width = width + "px";
                this.style.height = $('#'+el+' table.harpy>tbody').height() + "px";
            });
        }

        this.resize = resize;

        function drawCharts() {

            var standardConfig = {
                pieSliceTextStyle : {
                    color : '#000'
                },
                chartArea : {
                    top :30,left: 10,bottom: 30,right: 10,width:300
                }
            };

            var chartConfigs = {
                time : {
                    colors : ['#d9534f','#F63','#F96','#9C9','#FC6','#5cb85c'],
                    title : "Time"
                },
                type : {
                    colors : ['#CCC','#FFB','#FBF','#BBF','#FBB'],
                    title : "Content"
                },
                uncached : {
                    colors : ['#CCC','#FFB','#FBF','#BBF','#FBB'],
                    title : "Uncached content"
                },
                size : {
                    colors : ['#5cb85c','#d9534f'],
                    title : "Cache profile"
                }
            };

            for(var x in stats) {
                if(stats.hasOwnProperty(x)) {
                    var stat = stats[x];
                    var statData = [["",""]];
                    for(var i in stat) {
                        if(stat.hasOwnProperty(i)) {
                            statData[statData.length] = [i,(stat[i] < 0 ? 0 : stat[i])]
                        }
                    }
                }

                for(var j in standardConfig) {
                    if(standardConfig.hasOwnProperty(j)) {
                        chartConfigs[x][j] = standardConfig[j];
                    }
                }

                var chartEl = document.createElement("DIV");
                chartEl.className = 'harpyChart';
                document.getElementById(el).appendChild(chartEl);

                var data = google.visualization.arrayToDataTable(statData);
                var chart = new google.visualization.PieChart(chartEl);
                chart.draw(data,chartConfigs[x]);
            }
        }

        this.draw = function(elID) {
            el = elID;
            this.el = el;

            if(!google.visualization) {
                google.load("visualization", "1", {packages:["corechart"]});
                google.setOnLoadCallback(drawCharts);
            } else {
                drawCharts();
            }

            var bhvr = {
                selector : {
                    click : {
                        fn : function(e,obj) {
                            console.log(viewer);
                            viewer.showInfo(obj);
                        }
                    }
                }
            };
            bhvr["#"+el+" table.harpy>tbody>tr"] = bhvr.selector;
            delete bhvr.selector;
            Exos.enable([bhvr]);
            console.log(Exos.behaviours);

            var table = document.createElement("TABLE");
            table.className = "harpy";
            table.innerHTML = output;
            document.getElementById(el).appendChild(table);
            setTimeout(this.resize,1);

            if($.tablesorter){
                $(table).tablesorter({
                    sortList : [[0,0]]
                });
            }

        }
    }


    return {
        Viewer : Viewer
    }

}();
