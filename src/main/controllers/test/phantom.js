var EyeballControllersTestPhantom = function() {

    var phantomjs = require('phantomjs');
    var phantom = require('node-phantom-simple');

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
        ph.onError = error;
        ph.on("error",error);
        ph.on("exit",function(msg,trace) {
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
        phantom.create(function(err,ph){
            if(err) {
                eyeball.logger.error(err);
                return;
            }
            respond(ph,exit);
            create(ph);
        }, {
            phantomPath : phantomjs.path,
            parameters : {
                'proxy-type' : 'none',
                'web-security' : false,
                'ignore-ssl-errors' : true
            }
        });
    }

    function end() {
        var i=0;
        for(i = activePhantoms.length-1; i>=0; i--) {
            activePhantoms[i].exit();
        }
    }

    return {

        request : request,
        respond : respond,
        end : end

    };

};

module.exports = EyeballControllersTestPhantom();