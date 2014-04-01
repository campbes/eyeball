describe("EyeballControllersTestRecord",function() {

    var controller;

    beforeEach(function() {
        require = helpers.require;
        controller = EyeballControllersTestRecord();
    });

    it("checks that the test controller initialises correctly",function() {
        expect(controller).toBeDefined();
    });

});