/*global Eyeball,$,io,Harpy,google */

(function() {
    var eyeballScript = document.getElementById("eyeballScript");
    var host = eyeballScript.src.split("://")[0] + "://" + eyeballScript.src.split("://")[1].split("/")[0];
    var id = "eyeballBookmarklet";
    var container = document.getElementById(id);
    var build;
    var status;
    var progress;
    var gradesEl;
    var chartsEl;

    if(container) {
        container.parentNode.removeChild(container);
    }
    container = document.createElement("DIV");
    container.id = id;

    Eyeball.css.forEach(function(content) {
        var css = '<style>';
        css += content;
        css += '</style>';
        container.innerHTML += css;
    });

    var semCss = document.createElement('LINK');
    semCss.href = 'http://cdnjs.cloudflare.com/ajax/libs/semantic-ui/0.16.1/css/semantic.min.css';
    semCss.rel = 'stylesheet';
    semCss.type = 'text/css';
    container.appendChild(semCss);

    container.innerHTML += Eyeball.Templates.bookmarklet();
    document.body.appendChild(container);
    container = document.getElementById(id);

    function run() {
        container = $("#"+id);
        $("#eyeballClose").click(function(){container.remove();container = null;});

        function startSocket() {
            status.html("Eyeballing...");
            progress.width("50%");
            var socket = io.connect(host);
                socket.on('commitRecord_'+build, function (data) {
                socket.disconnect();
                status.html("Rendering....");
                progress.width("75%");
                $.ajax(host+'/v1/results/'+data.record._id+'?view=bookmarklet').success(function(data) {
                    gradesEl = $('#eyeballGrades');
                    gradesEl.html(Eyeball.Templates.grades(data));
                    gradesEl.find('.ui.accordion').accordion();
                    gradesEl.find('.ui.segment.attached.bottom').html('<a href="'+host+'/#/detail/:'+data.record._id+'">View full detailed results in Eyeball</a>');
                    var charts = ['time','uncached','size','timings','requests','download'];
                    chartsEl = $('#eyeballCharts');
                    chartsEl.html(Eyeball.Templates.charts({charts : charts}));
                    var comparator = new Harpy.Comparator(JSON.stringify(data.har.data),JSON.stringify(data.harUncached.data));
                    charts.forEach(function(chart) {
                        comparator.draw('chart-'+chart,chart);
                    });
                    chartsEl.height(320);
                    chartsEl.find('.button').click(function(){
                        chartsEl.find('.shape').shape('flip '+$(this).attr('data-direction'));
                    });
                    chartsEl.find('.ui.segment.attached.bottom').html('<a href="'+host+'/#/har/:'+data.record._id+'">View full HTTP analysis in Eyeball</a>');
                    status.html("Complete!");
                    progress.width("100%");
                    progress.parent().removeClass("active");
                });
            });
        }
        $.ajax(host+'/test',{
            data : {
                url : location.href,
                inputType : 'url'
            },
            method : 'post'
        }).done(function(res){
                if(res.error) {
                    status.html("Problem connecting to Eyeball");
                    return;
                }
                build = res.build;
                startSocket();
            });

    }

    function loadScript(src,cb) {
        var script = document.createElement("script");
        script.src = src;
        script.onload = cb;
        container.appendChild(script);
    }

    function loadDeps() {
        status = $('#eyeballStatus');
        status.html("Loading...");
        progress = $('#eyeballProgress');
        progress.width("25%");
        var $googleLoaded = new $.Deferred();
        if(window.google) {
            $googleLoaded.resolve();
        } else {
            loadScript('https://www.google.com/jsapi',function() {
                google.load("visualization", "1", {callback : function(){$googleLoaded.resolve();}, packages:["corechart"]});
            });
        }
        var $socketLoaded = new $.Deferred();
        if(window.io) {
            $socketLoaded.resolve();
        } else {
            loadScript('http://cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.16/socket.io.min.js',$socketLoaded.resolve);
        }
        var $uiLoaded = new $.Deferred();
        loadScript('http://cdnjs.cloudflare.com/ajax/libs/semantic-ui/0.16.1/javascript/semantic.min.js',$uiLoaded.resolve);
        $.when($googleLoaded,$socketLoaded,$uiLoaded).done(run);
    }

    if(window.$) {
        loadDeps();
    } else {
        loadScript('http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js',loadDeps);
    }
}());