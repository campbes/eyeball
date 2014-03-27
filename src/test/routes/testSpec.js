describe("tests the (express) routes",function() {

    describe("tests the config route", function(){
        it("tests that the correct response headers are set",function() {
            var response = routeConfig(null,helpers.res);
            expect(response.headers["Content-type"]).toBe("text/json");
            expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
            expect(response.headers["Access-Control-Allow-Methods"]).toBe("POST");
        });
        it("tests that the response is a json string of the report and test configs",function(){
            var response = routeConfig(null,helpers.res);
            var cfg = JSON.parse(response.output);
            expect(cfg.test.grades.percentage.A).toBe(helpers.require("/conf/test").grades.percentage.A);
            expect(cfg.report.fields.eyeball.metric).toBe(helpers.require("/conf/report").fields.eyeball.metric);
        });
    });

    describe("tests the report route",function(){
        it("tests that getDbQuery returns the proper query object",function(){
            require('url').init({
                query : {
                    build : "jeff,smith",
                    tag : "badgers",
                    start : "010101",
                    url : "test.com"
                }
            });
            var query = getDbQuery({});
            expect(query.build.$in[1]).toBe("smith");
            expect(query.tag).toBe("badgers");
            expect(query.timestamp.$gte.getTime()).toBe(256589596800000);
            expect(query.url.$regex).toBe("test.com");
        });
        it("tests the overview report route",function(){
            routeReportOverview({
                url : "test.com"
            },helpers.res);
            expect(eyeballTestData.cfg["metrics.overview.grades"]).toBe(1);
        });
        it("tests the standard report route",function(){
            routeReportStandard({
                url : "test.com"
            },helpers.res,"yslow");
            expect(eyeballTestData.cfg["metrics.yslow"]).toBe(1);
        });
    });

});