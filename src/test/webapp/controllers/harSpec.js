describe('HarCtrl', function() {

    var scope;

    beforeEach(module('eyeballControllers'));
    beforeEach(inject(function($rootScope, $controller) {
        scope = $rootScope.$new();
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


});