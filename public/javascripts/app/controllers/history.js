eyeballControllers.controller('HistoryCtrl',['$scope','$routeParams','$http','chart',

    function HistoryCtrl($scope,$routeParams,$http,chart) {

        $scope.data = [];
        $scope.query = $routeParams;

        $http({
            url: '/history?id='+$routeParams.id.substr(1),
            method: "GET"
        }).success(function(data) {
                var results = [];

                for(var i=0; i<data.length; i++) {
                    var highlight = null;
                    if(data[i]._id === $routeParams.id.substr(1)) {
                        highlight = data[i]._id;
                    }
                    results.push([
                        data[i].timestamp,
                        highlight,
                        chart.gradeMap((data[i].metrics.time ? data[i].metrics.time.grades.lt : data[i].metrics.yslow.grades.lt)),
                        chart.gradeMap(data[i].metrics.yslow.grades.o),
                        chart.gradeMap(data[i].metrics.dommonster.grades.COMPOSITE_stats)
                    ]);
                }


                var cols = [
                    ['string', 'Date'],
                    [{type:'string', role:'annotation'}],
                    ['number', 'Load time'],
                    ['number', 'YSlow'],
                    ['number', 'DomMonster']
                ];

                chart.drawHistoryChart(results,cols,'overviewHistory');


            });

    }

]);