eyeballControllers.controller('HistoryCtrl',['$scope','$routeParams','$http','chart','$location','fieldConfig',

    function HistoryCtrl($scope,$routeParams,$http,chart,$location,fieldConfig) {

        $scope.data = [];
        $scope.id = $routeParams.id.substr(1);
        $scope.query = $routeParams;
        $scope.url = 'Getting url...';
        $scope.timestamp = 'Getting timestamp...';
        $scope.fields = fieldConfig.history;

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
            }
            var array = [
                data._id,
                highlight,
                data._id+" ("+new Date(data.timestamp).toDateString()+")"
            ];

            for(var j =0; j<fieldConfig[tool].length; j++) {
                var f = fieldConfig[tool][j];
                array.push((data.metrics[f.tool] ? chart.gradeMap(data.metrics[f.tool].grades[f.metric]) : null));
            }

            return array;
        }



        $http({
            url: '/history?id='+$scope.id,
            method: "GET"
        }).success(function(data) {
                $scope.data = data;

                for(var n=0; n<$scope.fields.length;n++) {
                    var array = [];
                    var cols = [
                        ['string', 'ID'],
                        [{type:'string', role:'annotation'}],
                        [{type:'string',role:'tooltip'}]
                    ];

                    for(var i=0; i<data.length; i++) {
                        array.push(generateArray(data[i],cols,$scope.fields[n].tool));
                    }
                    for(var j =0; j<fieldConfig[$scope.fields[n].tool].length; j++) {
                        cols.push(['number',fieldConfig[$scope.fields[n].tool][j].name])
                    }
                    chart.drawHistoryChart(array,cols,$scope.fields[n].tool+'History',relocate);
                }

            });



    }

]);