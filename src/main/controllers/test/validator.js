var EyeballControllersTestValidator = function() {

    var validatorFiles = [];
    var activeVnus = [];
    var maxVnus = 1;

    function runValidator() {

        if(activeVnus.length === maxVnus || validatorFiles.length === 0) {
            return;
        }

        var item = validatorFiles.splice(0,1)[0];

        var htmlFile = item.file;
        var callback = item.cb;
        var vnuData = "";
        var vnu = require('child_process').spawn('java',['-jar','-Dnu.validator.client.out=json','-Dfile.encoding=UTF8','lib/vnu-fast-client.jar',htmlFile]);
        activeVnus.push(vnu);

        setTimeout(function(){
            vnu.kill();
        },5000);

        vnu.stdout.on('data',function(data) {
            vnuData += data;
        });

        vnu.stdout.on('end',function(code) {
            var errors = 0;
            var warnings = 0;
            var val;

            try {
                val = JSON.parse(vnuData);
            } catch (e) {
                eyeball.logger.error("Invalid VNU response: "+e);
                return;
            }
            var i = 0;
            for (i=val.messages.length-1; i>=0; i--) {
                if(val.messages[i].type === "error") {
                    errors += 1;
                } else
                if(val.messages[i].subType === "warning") {
                    warnings += 1;
                }
            }
            val.info = {
                errors : errors,
                warnings : warnings
            };

            callback(val);

        });

        vnu.stderr.on('data', function (err) {
            eyeball.logger.error('vnu client error: ' + err);
        });

        vnu.on('close', function (code) {
            var fs = require("fs");
            eyeball.logger.info('vnu child process closed ' + code);
            fs.unlink(htmlFile,function(err){
                if(err) {
                    console.log("error deleting validator file: "+err);
                }
                eyeball.logger.info("Deleting validator file");
            });
            var i = 0;
            for(i=activeVnus.length-1; i>=0; i--) {
                if(activeVnus[i] === vnu) {
                    activeVnus.splice(i,1);
                }
            }

            if(validatorFiles.length > 0) {
                runValidator();
            }

        });

        return item;

    }

    function validate(data,cb) {
        var htmlFile = (new Date()).getTime().toString() + (Math.random()*10).toString() + '.html';
        var fs = require("fs");

        var item = {file:htmlFile,cb : cb};
        validatorFiles.push(item);

        fs.writeFile(htmlFile,data.content,function(error){
            if(error) {
                eyeball.logger.info(error);
            }
            runValidator();
        });

        return item;

    }

    function end() {
        var fs = require("fs");
        var i =0;
        for(i = activeVnus.length-1; i>=0; i--) {
            activeVnus[i].kill();
        }
        for(i = validatorFiles.length-1; i>=0; i--) {
            fs.unlink(validatorFiles[i]);
        }
    }

    return {
        validate : validate,
        end : end,
        internal : {
            activeVnus : activeVnus,
            validatorFiles : validatorFiles,
            runValidator : runValidator
        }
    };

};

module.exports = EyeballControllersTestValidator();