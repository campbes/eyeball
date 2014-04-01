describe("EyeballControllersTestTest",function() {

    var controller;

    beforeEach(function() {
        require = helpers.require;
        controller = EyeballControllersTestTest();
    });

    it("checks that the test controller initialises correctly",function() {
        expect(controller.startTests).toBeDefined();
    });

});