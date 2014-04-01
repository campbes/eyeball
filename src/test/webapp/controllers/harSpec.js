describe('HarCtrl', function() {

    var scope;

    beforeEach(module('eyeballControllers'));
    beforeEach(inject(function($rootScope, $controller, $httpBackend) {

        scope = $rootScope.$new();
        httpBackend = $httpBackend;
        httpBackend.when("GET", "/detail?id=est").respond({
            url : "test.com",
            metrics : {
                har : {
                    data : {}
                },
                harUncached : {
                    data : {}
                }
            }
        });
        $controller("HarCtrl", {$scope: scope,
            $routeParams : {
                id : "test"
            },
            persist : {
                get : function(){
                    return "badgers"
                }
            }
        });
    }));

    it('tests that id and reportFilter are set to the scope', function() {
        expect(scope.id).toBe("est");
        expect(scope.reportFilter).toBe("badgers");
    });

    it("tests that scope data is set from response",function(){
        httpBackend.flush();
        expect(scope.url).toBe("test.com");
    });

});