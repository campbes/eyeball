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
        $scope.historyView = 'grades';

        var chartObjects = [];

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

        $scope.setHistoryView = function(view) {
            $scope.historyView = view;
            chartObjects.forEach(function(obj){
                setTimeout(function(){
                    chart.drawHistoryChart(obj[0],obj[1],obj[2],obj[3],obj[4]);
                },10);
            });
        };

        $http({
            url: '/v'+settings.apiVersion+'/results/'+$scope.id+'/history?fields=-metrics.har,-metrics.harUncached',
            method: "GET"
        }).success(function(data) {

                var colConfig = [
                    ['string', 'ID'],
                    [{type:'string', role:'annotation'}],
                    [{type:'string',role:'tooltip'}]
                ];

                $scope.data = data;
                var n = 0, i = 0, j = 0;
                var array = null;
                var cols = null;

                for(n=0; n<$scope.fields.length;n++) {
                    array = [];
                    cols = [].concat(colConfig);

                    for(i=0; i<data.length; i++) {
                        array.push(generateArray(data[i],cols,$scope.fields[n].tool));
                    }
                    for(j =0; j<config.fields[$scope.fields[n].tool].items.length; j++) {
                        cols.push(['number',config.fields[$scope.fields[n].tool].items[j].name]);
                    }
                    chart.drawHistoryChart(array,cols,$scope.fields[n].tool+'History',relocate,'grade');
                }

                var figureData = {
                    timings: [],
                    requests: [],
                    size: [],
                    requestsUncached: [],
                    sizeUncached: []
                };

                data.forEach(function(obj) {

                    var time = obj.metrics.time.data;
                    var yslow = obj.metrics.yslow.data.stats_c;
                    var yslowUncached = obj.metrics.yslow.data.stats;

                    figureData.timings.push([
                        obj._id,
                        (obj._id === $routeParams.id.substr(1) ? obj._id : null),
                        obj._id+" ("+new Date(obj.timestamp).toDateString()+")",
                        time.dt,
                        time.lt,
                        time.dt_u,
                        time.lt_u
                    ]);

                    function addYslowData(array,data,field) {
                        figureData[array].push([
                            obj._id,
                            (obj._id === $routeParams.id.substr(1) ? obj._id : null),
                            obj._id+" ("+new Date(obj.timestamp).toDateString()+")",
                            (data.doc ? data.doc[field] : 0),
                            (data.json ? data.json[field] : 0),
                            (data.css ? data.css[field] : 0),
                            (data.js ? data.js[field] : 0),
                            (data.image ? data.image[field] : 0)
                        ]);
                    }

                    addYslowData("requests",yslow,"r");
                    addYslowData("size",yslow,"w");
                    addYslowData("requestsUncached",yslowUncached,"r");
                    addYslowData("sizeUncached",yslowUncached,"w");
                });

                chartObjects.push([
                    figureData.timings,
                    [].concat(colConfig).concat([
                        ['number','DOM Load time'],
                        ['number','Load time'],
                        ['number','DOM Load time (uncached)'],
                        ['number','Load time (uncached)']
                    ]),
                    'timingsHistory',
                    relocate
                ]);

                var mimeTypes = [
                    ['number','HTML'],
                    ['number','JSON'],
                    ['number','CSS'],
                    ['number','JS'],
                    ['number','Image']
                ];

                function addYslowFigureChart(name) {
                    chartObjects.push([
                        figureData[name],
                        [].concat(colConfig).concat(mimeTypes),
                        name+'History',
                        relocate,
                        'area'
                    ]);
                }

                addYslowFigureChart("requests");
                addYslowFigureChart("size");
                addYslowFigureChart("requestsUncached");
                addYslowFigureChart("sizeUncached");

            });



    }

]);