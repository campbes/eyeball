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
        str += "<div>"+(obj.timings.blocked+obj.timings.dns+obj.timings.connect+obj.timings.send+obj.timings.wait+obj.timings.receive)/1000+"s</div>";
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

    function Viewer(har,options) {

        var el = null;

        options = options || {};

        var output = "";
        har = JSON.parse(har);

        var time = har.log.pages[0].pageTimings.onLoad;
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
            }
        };

        var size = 0;

        output += "<tr>";
        output += "<th>Req.</th>";
        output += "<th>Meth.</th>";
        output += "<th>URL</th>";
        output += "<th class='status'>Status</th>";
        output += "<th>Type</th>";
        output += "<th class='size'>Size</th>";
        output += "<th class='timeline'></th></tr>";

        for(var i=0; i<har.log.entries.length; i++) {
            var entry = har.log.entries[i];
            var url = entry.request.url;
            var type = getMimetype(entry.response.content.mimeType);

            for(var x in entry.timings) {
                if(entry.timings.hasOwnProperty(x)) {
                    stats.time[x] += Math.round(entry.timings[x]/1000);
                }
            }

            stats.type[type] += Math.round(entry.response.bodySize/1024);

            size += Math.round(entry.response.bodySize/1024);
            if(i>0) {
                url = url.replace(har.log.entries[0].request.url,"");
            }
            output += "<tr class='"+type+"'>";
            output += "<td>"+(i+1)+"</td>"
            output += "<td>"+entry.request.method+"</td>"
            output += "<td title='"+url+"' class='url'>"+url.substr(0,30)+(url.length > 30 ? "..." : "")+"</td>";
            output += "<td title='"+entry.response.status+" "+entry.response.statusText+"'>"+entry.response.status+"</td>";
            output += "<td title='"+entry.response.content.mimeType+"'>"+type+"</td>"
            output += "<td>"+Math.round(entry.response.bodySize/1024)+" KB</td>";
            output += "<td>"+buildTimeline(entry,startTime)+"</td>"
            output += "</tr>";
        }
        output += "<tr class='total'>";
        output += "<td>"+har.log.entries.length+"</td>";
        output += "<td></td><td></td><td></td><td></td><td>"+size+" KB</td>";
        output += "<td class='total'>"+time/1000+"s</td>";
        output += "</tr>";

        this.resize = function() {
            var timeline = $('#'+el+' th.timeline');
            var unit = (timeline.width() - 50)/time;
            var times = $('#'+el+' table.harpy div');
            times.each(function() {
                if(this.hasAttribute('data-start')) {
                    this.style.marginLeft = Number(this.getAttribute('data-start'))*unit + "px";
                }
                this.style.width = Number(this.getAttribute('data-time'))*unit + "px";
            });
        };

        this.draw = function(elID) {
            el = elID;
            this.el = el;
            var table = document.createElement("TABLE");
            table.className = "harpy";
            table.innerHTML = output;
            document.getElementById(el).appendChild(table);

            google.load("visualization", "1", {packages:["corechart"]});

            var chartConfigs = {
                time : {
                    colors : ['#d9534f','#F63','#F96','#9C9','#FC6','#5cb85c']
                },
                type : {
                    colors : ['#CCC','#CCE','#FCF','#CCF','#FFC']
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
                var chartEl = document.createElement("DIV");
                chartEl.className = 'harpyChart';
                document.getElementById(el).appendChild(chartEl);
                var data = google.visualization.arrayToDataTable(statData);
                var chart = new google.visualization.PieChart(chartEl);
                chart.draw(data,chartConfigs[x]);
            }

            this.resize();
        }
    }


    return {
        Viewer : Viewer
    }

}();
