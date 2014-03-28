describe("tests the test controller page module",function() {

    var controller;

    beforeEach(function() {
        require = helpers.require;
        controller = EyeballControllersTestPage();
    });

    it("checks that the test controller initialises correctly",function() {
        expect(controller).toBeDefined();
    });

});