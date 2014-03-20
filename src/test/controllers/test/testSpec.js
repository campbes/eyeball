describe("tests the test controller",function() {

    var controller;

    beforeEach(function() {
        require = helpers.require;
        controller = testController();
    });

    it("checks that the test controller initialises correctly",function() {
        expect(controller.startTests).toBeDefined();
    });

});