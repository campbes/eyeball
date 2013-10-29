eyeballControllers.controller('HistoryCtrl',['$scope','$routeParams','$http','chart','$location',

    function HistoryCtrl($scope,$routeParams,$http,chart,$location) {

        $scope.data = [];
        $scope.id = $routeParams.id.substr(1);
        $scope.query = $routeParams;
        $scope.url = 'Getting url...';
        $scope.timestamp = 'Getting timestamp...';

        function relocate(obj) {
            $scope.$apply(function(){
                $location.path('/history/:'+obj.id);
            });
        }

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
                        data[i]._id,
                        highlight,
                        data[i]._id+" ("+new Date(data[i].timestamp).toDateString()+")",
                        chart.gradeMap((data[i].metrics.time ? data[i].metrics.time.grades.lt : data[i].metrics.yslow.grades.lt)),
                        chart.gradeMap(data[i].metrics.yslow.grades.o),
                        chart.gradeMap(data[i].metrics.dommonster.grades.COMPOSITE_stats)
                    ]);
                    yslow.push([
                        data[i]._id,
                        highlight,
                        data[i]._id+" ("+new Date(data[i].timestamp).toDateString()+")",
                        chart.gradeMap(data[i].metrics.yslow.grades.o),
                        chart.gradeMap(data[i].metrics.yslow.grades.w),
                        chart.gradeMap(data[i].metrics.yslow.grades.r),
                        chart.gradeMap(data[i].metrics.yslow.grades.w_c),
                        chart.gradeMap(data[i].metrics.yslow.grades.r_c),
                        chart.gradeMap(data[i].metrics.yslow.grades.g.yminify)
                    ]);
                }

                var colsOverview = [
                    ['string', 'ID'],
                    [{type:'string', role:'annotation'}],
                    [{type:'string',role:'tooltip'}],
                    ['number', 'Load time'],
                    ['number', 'YSlow'],
                    ['number', 'DomMonster']
                ];
                var colsYslow = [
                    ['string', 'ID'],
                    [{type:'string', role:'annotation'}],
                    [{type:'string',role:'tooltip'}],
                    ['number', 'Overall'],
                    ['number', 'Size'],
                    ['number', 'HTTP Requests'],
                    ['number', 'Size (cached)'],
                    ['number', 'HTTP (cached)'],
                    ['number', 'Inline JS/CSS']
                ];

                chart.drawHistoryChart(overview,colsOverview,'overviewHistory',relocate);
                chart.drawHistoryChart(yslow,colsYslow,'yslowHistory',relocate);


            });

    }

]);