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

    function Viewer(har,options) {

        var el = null;

        options = options || {};

        var output = "<table class='harpy'>";
        har = JSON.parse(har);

        var time = har.log.pages[0].pageTimings.onLoad;
        var startTime = new Date(har.log.pages[0].startedDateTime);

        var size = 0;

        output += "<tr><th></th><th></th><th class='status'></th><th class='size'></th><th class='timeline'></th></tr>"

        for(var i=0; i<har.log.entries.length; i++) {
            var entry = har.log.entries[i];
            var url = entry.request.url;
            size += Math.round(entry.response.bodySize/1024);
            if(i>0) {
                url = url.replace(har.log.entries[0].request.url,"");
            }
            output += "<tr>";
            output += "<td>"+entry.request.method+"</td>"
            output += "<td class='url'>"+url.substr(0,30)+"</td>";
            output += "<td title='"+entry.response.status+" "+entry.response.statusText+"'>"+entry.response.status+"</td>";
            output += "<td>"+Math.round(entry.response.bodySize/1024)+" KB</td>";
            output += "<td>"+buildTimeline(entry,startTime)+"</td>"
            output += "</tr>";
        }
        output += "<tr>";
        output += "<td>"+har.log.entries.length+" Req</td>";
        output += "<td></td><td></td><td>"+size+" KB</td>";
        output += "<td class='total'>"+time/1000+"s</td>";
        output += "</tr></table>";

        this.resize = function() {
            var timeline = $('#'+el+' th.timeline');
            var unit = (timeline.width() - 50)/time;
            var times = $('#'+el+' div');
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
            document.getElementById(el).innerHTML = output;
            this.resize();
        }
    }


    return {
        Viewer : Viewer
    }

}();
