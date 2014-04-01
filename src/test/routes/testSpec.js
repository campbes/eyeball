describe("Tests the Express routes",function() {

    describe("EyeballRoutesConfig", function(){
        it("tests that the correct response headers are set",function() {
            EyeballRoutesConfig(null,helpers.res);
            expect(helpers.res.headers["Content-type"]).toBe("text/json");
            expect(helpers.res.headers["Access-Control-Allow-Origin"]).toBe("*");
            expect(helpers.res.headers["Access-Control-Allow-Methods"]).toBe("GET");
        });
        it("tests that the response is a json string of the report and test configs",function(){
            var response = EyeballRoutesConfig(null,helpers.res);
            var cfg = JSON.parse(response.output);
            expect(cfg.test.grades.percentage.A).toBe(helpers.require("/conf/test").grades.percentage.A);
            expect(cfg.report.fields.eyeball.metric).toBe(helpers.require("/conf/report").fields.eyeball.metric);
        });
    });

    describe("EyeballRoutesReport",function(){
        it("tests the overview report route",function(){
            EyeballRoutesReportOverview({
                url : "test.com"
            },helpers.res);
            expect(eyeballTestData.cfg["metrics.overview.grades"]).toBe(1);
        });
        it("tests the standard report route",function(){
            EyeballRoutesReportStandard({
                url : "test.com"
            },helpers.res,"yslow");
            expect(eyeballTestData.cfg["metrics.yslow"]).toBe(1);
        });
    });

    describe("EyeballRoutesTest", function(){
        it("tests that the correct response headers are set",function() {
            EyeballRoutesTest({
                body : {
                    datafile : ""
                }
            },helpers.res);
            expect(helpers.res.headers["Access-Control-Allow-Origin"]).toBe("*");
            expect(helpers.res.headers["Access-Control-Allow-Methods"]).toBe("POST");
        });
        it("tests the go method when a url is passed in",function() {
            var testRoute = EyeballRoutesTest({
                body : {
                    datafile : ""
                }
            },helpers.res);
            var cfg = testRoute.go("http://test.com");
            expect(cfg.urls[0]).toBe("http://test.com");
        });
        it("tests the go method when a datafile is passed in",function() {
            var testRoute = EyeballRoutesTest({
                body : {
                    datafile : "test.com\r\ngoogle.com"
                }
            },helpers.res);
            var cfg = testRoute.go("test.com\r\ngoogle.com");
            expect(cfg.urls[1]).toBe("google.com");
        });

    });
    describe("EyeballRoutesDetail", function(){
        it("tests that the yslow rules are added to results",function() {
            eyeballTestData = [{
                metrics : {
                    yslow : {
                        data : {
                            g : {
                                "myMadeUpRule" : {}
                            }
                        }
                    }
                }
            }];
            eyeballTestData.query = {
                id : "1234"
            };

            var detail = EyeballRoutesDetail({},helpers.res);
            expect(detail.metrics.yslow.data.g.myMadeUpRule.rule).toBe("Test rule");
        });
    });
    describe("EyeballRoutesHistory",function(){
        it("tests the history report route",function(){
            eyeballTestData = [{
                url :  "test.com"
            }];
            var historyRoute = EyeballRoutesHistory({
                url : "test.com"
            },helpers.res);
            expect(historyRoute["metrics.overview.grades"]).toBe(1);
        });
    });

});