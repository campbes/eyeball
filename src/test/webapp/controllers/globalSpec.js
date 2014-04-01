describe('GlobalCtrl', function() {

    var scope;

    beforeEach(module('eyeballControllers'));
    beforeEach(inject(function($rootScope, $controller) {
        scope = $rootScope.$new();
        $controller("GlobalCtrl", {$scope: scope , logger : logger});
    }));

    it('tests that page variable is set to global', function() {
        expect(scope.page).toBe("global");
    });

    it('tests that page variable can be set via the setPage  method', function() {
        scope.setPage("stu");
        expect(scope.page).toBe("stu");
    });

    it('tests that calling quickTest broadcasts the event with the correct url', function() {
        spyOn(scope,"$broadcast");
        scope.quickTest("http://stu.com");
        expect(scope.$broadcast).toHaveBeenCalledWith("quickTest","http://stu.com");
    });

});