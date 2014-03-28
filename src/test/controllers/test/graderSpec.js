describe("tests the testsers module of testController",function() {

    var grader;

    beforeEach(function() {
        require = helpers.require;
        grader = EyeballControllersTestGrader();
    });

    it("tests that getValue returns a value for a grade",function() {
        expect(grader.getValue("E","points")).toBe(16);
    });

    it("tests that a gradeSet is returned",function(){
        var testData = {o:90,w:80,w_c:70,r:60,r_c:50,lt:40,g:30};
        var gradeSet = grader.getGradeSet({data:testData,tool : "yslow"});
        expect(gradeSet.o).toBe("A");
    });

    it("tests getting a composite grade from data",function(){
        var testData = {"COMPOSITE_stats" : 90, stats : { elements : 1000}};
        var gradeSet = grader.getGradeSet({data:testData,tool : "dommonster"});
        expect(gradeSet.COMPOSITE_stats).toBe("D");
    });

});