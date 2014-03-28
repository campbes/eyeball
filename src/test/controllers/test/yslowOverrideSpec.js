describe("tests the test controller yslowOverride module",function() {

    var controller;

    beforeEach(function() {
        require = helpers.require;
        controller = EyeballControllersTestYslowOverride();
    });

    it("checks that the test controller initialises correctly",function() {
        expect(controller).toBeDefined();
    });

});