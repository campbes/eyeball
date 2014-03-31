describe('test the detail controller', function() {

    var scope;
    var httpBackend;

    beforeEach(module('eyeballControllers'));
    beforeEach(inject(function($rootScope, $controller, $httpBackend) {
         scope = $rootScope.$new();
         httpBackend = $httpBackend;
         httpBackend.when("GET", "/detail?id=est").respond({
             url : "test.com"
         });
         $controller("DetailCtrl", {
             $scope: scope,
             $routeParams : {
                 id : "test"
             },
             logger : logger,
             config : {
                 data : {
                     report : {
                         fields : {
                             display : {
                                 items : ["jeff"]
                             }
                         }
                     }
                 }
             },
             render:{},
             persist: {
                 get : function() {}
             },
             utils: {}
         });
    }));

    it('tests that id is set to id param minus the first character', function() {
        expect(scope.id).toBe("est");
    });

    it("tests making the call to the backend and that fields gets set to the scope",function(){
        httpBackend.flush();
        expect(scope.fields[0]).toBe("jeff");
    });

});