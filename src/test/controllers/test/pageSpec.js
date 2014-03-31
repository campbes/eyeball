describe("tests the test controller page module",function() {

    var controller, page;

    beforeEach(function() {
        require = helpers.require;
        controller = EyeballControllersTestPage();
        page = controller.setup({
            setFn : function(name,cb){
                cb();
            },
            evaluate : function() {}
        });
    });

    it("tests onResourceRequested sets the correct properties",function() {
        page.onResourceRequested([{
            id : "test"
        }]);
        expect(page.resources["test"].request.id).toBe("test");
    });

    it("tests onResourceReceived adds the startReply",function() {
        page.onResourceRequested([{
            id : "test"
        }]);
        page.onResourceReceived({
            id : "test",
            stage : "start"
        });
        expect(page.resources["test"].startReply.id).toBe("test");
    });

    it("tests onResourceReceived adds the endReply",function() {
        page.onResourceRequested([{
            id : "test"
        }]);
        page.onResourceReceived({
            id : "test",
            stage : "end"
        });
        expect(page.resources["test"].endReply.id).toBe("test");
    });

});