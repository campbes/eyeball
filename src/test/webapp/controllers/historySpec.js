describe('HistoryCtrl', function() {

    var scope;
    var httpBackend;
    var chart = {
        drawHistoryChart : function(){}
    };

    beforeEach(module('eyeballControllers'));
    beforeEach(inject(function($rootScope, $controller,$httpBackend) {
        scope = $rootScope.$new();
        scope.setPage = function(){};
        httpBackend = $httpBackend;
        httpBackend.when("GET", '/history?id=est').respond([
            {
                _id : 'est'
            }
        ]);
        $controller("HistoryCtrl", {
            $scope: scope,
            $routeParams : {
                id : "test"
            },
            chart : chart,
            config : {
                data : {
                    report : {
                        fields : {
                            display : {
                                items : [{
                                    name : 'jeff',
                                    tool : 'jeff'
                                }]
                            },
                            jeff : {
                                items: []
                            }
                        }
                    }
                }
            },
            persist: {
                get : function() {}
            },
            render : {}
        });
    }));

    it('tests that data is added to scope after hitting history endpoint', function() {
        httpBackend.flush();
        expect(scope.data[0]._id).toBe("est");
    });

    it('tests that history chart is drawn', function() {
        spyOn(chart,"drawHistoryChart");
        httpBackend.flush();
        expect(chart.drawHistoryChart).toHaveBeenCalled();
    });

});