/*global Eyeball,$,io,Harpy,google */

    var eyeballScript = document.getElementById("eyeballScript");
    var host = eyeballScript.src.split("://")[0] + "://" + eyeballScript.src.split("://")[1].split("/")[0];
    var id = "eyeballBookmarklet";
    var container = document.getElementById(id);
    var config;
    var build;

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
        var status = $('#eyeballStatus');
        var progress = $('#eyeballProgress');
        function startSocket() {
            status.html("Eyeballing...");
            progress.width("50%");
            var socket = io.connect(host);
                socket.on('commitRecord_'+build, function (data) {
                socket.disconnect();
                status.html("Rendering....");
                progress.width("75%");
                $.ajax(host+'/v1/results/'+data.record._id+'?view=bookmarklet').success(function(data) {
                    $('#eyeballGrades').html(Eyeball.Templates.grades(data));
                    $('#eyeballGrades .ui.accordion').accordion();
                    var charts = ['time','uncached','size','timings','requests','download'];
                    $('#eyeballCharts').html(Eyeball.Templates.charts({charts : charts}));
                    var comparator = new Harpy.Comparator(JSON.stringify(data.har.data),JSON.stringify(data.harUncached.data));
                    charts.forEach(function(chart) {
                        comparator.draw('chart-'+chart,chart);
                    });
                    $('#eyeballCharts').height(320);
                    $('.button').click(function(){
                        $('.shape').shape('flip '+$(this).attr('data-direction'));
                    });
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

    function loadScript(src,$def) {
        var script = document.createElement("script");
        script.src = src;
        script.onload = function() {
            $def.resolve();
        };
        document.body.appendChild(script);
    }

    function loadDeps() {
        $('#eyeballStatus').html("Loading...");
        $('#eyeballProgress').width("25%");
        var $googleLoaded = new $.Deferred();
        if(window.google) {
            $googleLoaded.resolve();
        } else {
            var script = document.createElement("script");
            script.src = 'https://www.google.com/jsapi';
            script.onload = function() {
                google.load("visualization", "1", {callback : function(){$googleLoaded.resolve();}, packages:["corechart"]});
            };
            document.body.appendChild(script);
        }
        var $socketLoaded = new $.Deferred();
        if(window.io) {
            $socketLoaded.resolve();
        } else {
            loadScript('http://cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.16/socket.io.min.js',$socketLoaded);
        }
        var $uiLoaded = new $.Deferred();
        loadScript('http://cdnjs.cloudflare.com/ajax/libs/semantic-ui/0.16.1/javascript/semantic.min.js',$uiLoaded);
        $.when($googleLoaded,$socketLoaded,$uiLoaded).done(run);
    }

    function loadJQ() {
        var script = document.createElement("script");
        script.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js';
        script.onload = loadDeps;
        container.appendChild(script);
    }

    if(window.$) {
        loadDeps();
    } else {
        loadJQ();
    }
