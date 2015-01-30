/*global eyeballControllers*/

eyeballControllers.controller('HistoryCtrl',['settings','$scope','$routeParams','$http','chart','$location','config','persist','render',

    function HistoryCtrl(settings,$scope,$routeParams,$http,chart,$location,config,persist,render) {
        config = config.data.report;
        $scope.data = [];
        $scope.id = $routeParams.id.substr(1);
        $scope.query = $routeParams;
        $scope.url = 'Getting url...';
        $scope.timestamp = 'Getting timestamp...';
        $scope.fields = config.fields.display.items;
        $scope.reportFilter = persist.get("reportFilter");

        function relocate(obj) {
            $scope.$apply(function(){
                $location.path('/history/:'+obj.id);
            });
        }

        function generateArray(data,cols,tool) {
            var highlight = null;
            if(data._id === $routeParams.id.substr(1)) {
                highlight = data._id;
                $scope.url = data.url;
                $scope.timestamp = data.timestamp;
                $scope.build = data.build;
                $scope.tag = data.tag;
            }
            var array = [
                data._id,
                highlight,
                data._id+" ("+new Date(data.timestamp).toDateString()+")"
            ];

            var j = 0;
            var f = null;
            for(j =0; j<config.fields[tool].items.length; j++) {
                f = config.fields[tool].items[j];
                array.push((data.metrics[f.tool] ? chart.gradeMap(render.accessObject(data.metrics[f.tool].grades,f.metric),j,config.fields[tool].items.length) : 0));
            }
            return array;
        }

        $http({
            url: '/v'+settings.apiVersion+'/results/'+$scope.id+'/history?fields=-metrics.har,-metrics.harUncached',
            method: "GET"
        }).success(function(data) {
                $scope.data = data;
                var n = 0, i = 0, j = 0;
                var array = null;
                var cols = null;

                for(n=0; n<$scope.fields.length;n++) {
                    array = [];
                    cols = [
                        ['string', 'ID'],
                        [{type:'string', role:'annotation'}],
                        [{type:'string',role:'tooltip'}]
                    ];

                    for(i=0; i<data.length; i++) {
                        array.push(generateArray(data[i],cols,$scope.fields[n].tool));
                    }
                    for(j =0; j<config.fields[$scope.fields[n].tool].items.length; j++) {
                        cols.push(['number',config.fields[$scope.fields[n].tool].items[j].name]);
                    }
                    chart.drawHistoryChart(array,cols,$scope.fields[n].tool+'History',relocate);
                }

            });



    }

]);