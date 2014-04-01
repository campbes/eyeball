describe('MonitorCtrl', function() {

    var scope;
    var httpBackend;

    beforeEach(module('eyeballControllers'));
    beforeEach(inject(function($rootScope, $controller,$httpBackend) {
        scope = $rootScope.$new();
        scope.setPage = function(){};
        httpBackend = $httpBackend;
        httpBackend.when("GET", "/monitor").respond("stuff");
        $controller("MonitorCtrl", {$scope: scope});
    }));

    it('tests that data is added to scope after hitting monitor endpoint', function() {
        httpBackend.flush();
        expect(scope.data).toBe("stuff");
    });


});