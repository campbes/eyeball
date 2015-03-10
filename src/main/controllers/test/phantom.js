var EyeballControllersTestPhantom = function() {

    var phantomjs = require('phantomjs');
    var phantom = require('phantom');

    var activePhantoms = [];
    var phantomMax = 10;

    function phantomExit(msg,ph) {
        var pid = ph.process.pid;
        eyeball.logger.info("Phantom Exit: "+pid+ "("+msg+")");
        var i = 0;
        for(i=activePhantoms.length-1; i>=0; i--) {
            if(activePhantoms[i] === ph) {
                activePhantoms.splice(i,1);
            }
        }
    }

    function phantomError(err,trace,ph) {
        eyeball.logger.info("Phantom error: "+err);
        if (trace) {
            trace.forEach(function(item) {
                eyeball.logger.debug("Phantom error: "+item.file+" : "+item.line);
            });
        }
        ph.exit(1);
    }

    function respond(ph,exit) {
        function error(err,trace) {
            phantomError(err,trace,ph);
        }
        ph.set("onError",error);
        ph.set("onExit",function(msg,trace) {
            phantomExit(msg,ph);
            exit(ph.process.pid);
        });
        activePhantoms.push(ph);
        eyeball.logger.info("Active Phantoms: "+activePhantoms.length);
    }

    function request(create,exit) {
        if(activePhantoms.length >= phantomMax) {
            return;
        }
        phantom.create(function(ph,err){
            if(err) {
                eyeball.logger.error(err);
                return;
            }
            respond(ph,exit);
            create(ph);
        }, {
            dnodeOpts : {
                weak : false
            },
            path : phantomjs.path.replace('phantomjs.exe',''),
            parameters : {
                'proxy' : eyeball.HOSTNAME+":"+eyeball.PROXYPORT,
                //'proxy-type' : 'none',
                'web-security' : false,
                'ignore-ssl-errors' : true,
                'disk-cache' : true
            }
        });
    }

    function end() {
        var i=0;
        for(i = activePhantoms.length-1; i>=0; i--) {
            activePhantoms[i].exit();
        }
    }

    process.on("exit",function() {
        activePhantoms.forEach(function(phantom) {
            phantom.kill();
        });
    });

    return {

        request : request,
        respond : respond,
        end : end

    };

};

module.exports = EyeballControllersTestPhantom();