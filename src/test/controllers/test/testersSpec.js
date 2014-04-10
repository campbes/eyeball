describe("EyeballControllersTestTesters",function() {

    var testers;

    beforeEach(function() {
        require = helpers.require;
        testers = EyeballControllersTestTesters();
    });
    afterEach(function() {
        testers = null;
    });

    it("tests that the dommonster tester function strips units and leaves a string version of a number",function() {
        var page = {
            EYEBALLTEST : {
                dommonster : {
                    stats : {
                        testOne : "some 1",
                        testTwo : "2 badgers"
                    }
                }
            }
        };
        var cb = function(){};
        var dm = testers.dommonster(page,cb).stats;
        expect(dm.testOne).toBe("1");
        expect(dm.testTwo).toBe("2");
    });

    it("tests that the dommonster tester function fires callback on completion",function() {
        var page = {
            EYEBALLTEST : {
                dommonster : {
                    stats : {}
                }
            }
        };
        var cb = jasmine.createSpy();
        testers.dommonster(page,cb);
        expect(cb).toHaveBeenCalledWith(page.EYEBALLTEST.dommonster);
    });

    it("tests that the validator tester creates a new item and adds it to the validatorFiles array, then calls writeFile",function() {
        var data ="<div>some stuff</div>";
        var cb = function(){};
        var validator = EyeballControllersTestValidator();
        var val = validator.validate(data,cb);
        expect(val.file).toContain(".html");
        expect(val.cb).toBe(cb);
        expect(spies.writeFile).toHaveBeenCalled();
        expect(validator.internal.validatorFiles.length).toBe(1);
        expect(validator.internal.validatorFiles[0]).toBe(val);
    });

    it("tests that runValidator takes an item off the validatorFiles array and fires up a vnu",function() {
        var data ="<div>some stuff</div>";
        var cb = function(){};
        var validator = EyeballControllersTestValidator();
        validator.validate(data,cb);

        //disable vnu.on so that we can test the internals
        require = function(name){
            if(name === "child_process") {
                var on = function(evt,cb){};
                var stdout = {
                    on : on
                };
                var stderr = stdout;
                return {
                    spawn : function(){
                        return {
                            on : on,
                            stdout : stdout,
                            stderr : stderr
                        }
                    }
                }
            }
        };

        var result = validator.internal.runValidator();
        expect(result[0]).toBe(validator.internal.validatorFiles[0]);
        expect(validator.internal.validatorFiles.length).toBe(0);
        expect(validator.internal.activeVnus.length).toBe(1);
    });

    it("tests that the yslow tester function adds the grading and message information",function() {
        var page = {
            EYEBALLTEST : {
                dommonster : {
                    stats : {}
                }
            }
        };

        var yslow = testers.yslow(page,function(res) {
            return res;
        });
        expect(yslow.o).toBe(90);
        expect(yslow.g.overall.score).toBe(90);
        expect(yslow.g.overall.grade).toBe("A");
    });

    it("tests that when the vnu stream closes it removes an active vnu",function() {
        var data ="<div>some stuff</div>";
        var cb = function(){};
        var validator = EyeballControllersTestValidator();
        var val = validator.validate(data,cb);
        var result = validator.internal.runValidator();
        expect(validator.internal.activeVnus.length).toBe(0);
    });

});