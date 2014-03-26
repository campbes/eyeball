/*global Eyeball,$,io */

    var eyeballScript = document.getElementById("eyeballScript");
    var host = eyeballScript.src.split("://")[0] + "://" + eyeballScript.src.split("://")[1].split("/")[0];
    var id = "eyeballBookmarklet";
    var container = document.getElementById(id);
    var config;
    var metrics;

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
    Eyeball.html.forEach(function(content) {
        container.innerHTML += content;
    });
    document.body.appendChild(container);
    container = document.getElementById(id);

    function getMetric(data,obj) {
        var item = config.report.fields[obj];
        var grade = data.record.metrics[obj].grades[item.metric];
        var str = "<li class='eyeball"+grade+"'>";
        str += "<span>"+grade+"</span>";
        str += item.name;
        str += "</li>";
        return str;
    }

    function run() {
        container = $("#"+id);
        var status =  $('#eyeballStatus');
        $("#"+id+">button").click(function(){container.remove();container = null;});
        var build = new Date().getTime().toString() + Math.random();

        function startSocket() {
            var socket = io.connect(host);
            socket.on('commitRecord_'+build, function (data) {
                socket.disconnect();
                status.html("Success!");
                metrics = $("#eyeballBookmarklet>ul");
                config.report.fields.overview.items.forEach(function(obj){
                    metrics.append(getMetric(data,obj));
                });
                container.append('<a href="'+host+'/#/detail/:'+data.record._id+'">View full details in Eyeball</a>');
            });
        }

        $.ajax(host+'/config').done(function(data){
            config = data;
            container.append("<ul></ul>");
            $.ajax(host+'/test',{
                data : {
                    url : location.href,
                    inputType : 'url',
                    build : build
                },
                method : 'post'
            }).done(function(res){
                    if(res !== "OK") {
                        status.html("Problem connecting to Eyeball");
                        return;
                    }
                    startSocket();
                    status.html("Eyeballing...");
                });
        });
    }

    function loadJQ() {
        var script = document.createElement("script");
        script.src = '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js';
        script.onload = run;
        container.appendChild(script);
    }

    if(window.io) {
        run();
    } else {
        var script = document.createElement("script");
        script.src = host+'/socket.io/socket.io.js';
        script.onload = function() {
            if(window.$) {
                run();
                return;
            }
            loadJQ();
        };
        container.appendChild(script);
    }