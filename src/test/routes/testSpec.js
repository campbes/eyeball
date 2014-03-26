describe("tests the (express) routes",function() {

    describe("tests the config route", function(){
        it("tests that the correct response headers are set",function() {
            var response = routeConfig(null,helpers.res);
            expect(response.headers["Content-type"]).toBe("text/json");
            expect(response.headers["Content-type"]).toBe("text/json");
            expect(response.headers["Content-type"]).toBe("text/json");
        });
        it("tests that the response is a json string of the report and test configs",function(){
            var response = routeConfig(null,helpers.res);
            var cfg = JSON.parse(response.output);
            expect(cfg.test.grades.percentage.A).toBe(testCfg().grades.percentage.A);
        });
    });


});