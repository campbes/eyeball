eyeballControllers.controller('HistoryCtrl',['$scope','$routeParams','$http','chart',

    function HistoryCtrl($scope,$routeParams,$http,chart) {

        $scope.data = [];
        $scope.id = $routeParams.id.substr(1);
        $scope.query = $routeParams;
        $scope.url = 'Getting url...';
        $scope.timestamp = 'Getting timestamp...';

        $http({
            url: '/history?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
                var overview = [];
                var yslow = [];

                $scope.data = data;

                for(var i=0; i<data.length; i++) {
                    var highlight = null;
                    if(data[i]._id === $routeParams.id.substr(1)) {
                        highlight = data[i]._id;
                        $scope.url = data[i].url;
                        $scope.timestamp = data[i].timestamp;
                    }
                    overview.push([
                        data[i]._id + " ("+data[i].timestamp+")",
                        highlight,
                        chart.gradeMap((data[i].metrics.time ? data[i].metrics.time.grades.lt : data[i].metrics.yslow.grades.lt)),
                        chart.gradeMap(data[i].metrics.yslow.grades.o),
                        chart.gradeMap(data[i].metrics.dommonster.grades.COMPOSITE_stats)
                    ]);
                    yslow.push([
                        data[i]._id + " ("+data[i].timestamp+")",
                        highlight,
                        chart.gradeMap(data[i].metrics.yslow.grades.o),
                        chart.gradeMap(data[i].metrics.yslow.grades.r),
                        chart.gradeMap(data[i].metrics.yslow.grades.w)
                    ]);
                }

                var colsOverview = [
                    ['string', 'ID'],
                    [{type:'string', role:'annotation'}],
                    ['number', 'Load time'],
                    ['number', 'YSlow'],
                    ['number', 'DomMonster']
                ];
                var colsYslow = [
                    ['string', 'ID'],
                    [{type:'string', role:'annotation'}],
                    ['number', 'Overall'],
                    ['number', 'HTTP'],
                    ['number', 'Size']
                ];

                chart.drawHistoryChart(overview,colsOverview,'overviewHistory');
                chart.drawHistoryChart(yslow,colsYslow,'yslowHistory');


            });

    }

]);