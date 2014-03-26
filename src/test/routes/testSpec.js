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
        it("tests the overview report route",function(){

            //spyOn(eyeball.DB,"find");
            var response = routeReportOverview({});
            //expect(eyeball.DB.find).toHaveBeenCalled();
        });
    });

});