/*global eyeballControllers,Harpy,$*/

eyeballControllers.controller('CompareCtrl',['settings','$scope','$routeParams','$http','persist','harpy',

    function CompareCtrl(settings,$scope,$routeParams,$http,persist,harpy) {
        var recordIds = $routeParams.records.substr(1);

        var mimeTypes = {};

        var sizes = {
          cached : {},
          uncached : {}
        };

        var requests = {
          cached : {},
          uncached : {}
        };

      var time = {
        cached: [
          ['URL','Dom load','Page load']
        ],
        uncached: [
          ['URL','Dom load','Page load']
        ]
      };

        var colors = ['#FFB','#9C9','#FBF','#BBF'];

      var summaryConfig = {
        isStacked: true,
        colors: colors,
        backgroundColor: {fill: 'transparent'},
        legend: {
          textStyle: {
            color: '#FFF'
          }
        },
        titleTextStyle: {
          color: '#FFF'
        },
        dataOpacity: 0.7,
        hAxis: {
          maxValue: 0,
          textStyle: {
            color: '#FFF'
          }
        },
        vAxis: {
          maxValue: 0,
          textStyle: {
            color: '#FFF'
          }
        }
      };
      var typeConfig = {
        colors: ['#FFB','#9C9','#FBF','#BBF'],
        backgroundColor: {fill: 'transparent'},
        legend: {
          position: 'none'
        },
        titleTextStyle: {
          color: '#FFF'
        },
        dataOpacity: 0.7,
        hAxis: {
          maxValue: 0,
          textStyle: {
            color: '#FFF'
          }
        },
        vAxis: {
          maxValue: 0,
          textStyle: {
            color: '#FFF'
          }
        }
      };

        $http({
            url: '/v'+settings.apiVersion+'/results/'+recordIds+'?fields=url,timestamp,build,tag,metrics.har,metrics.harUncached,metrics.time.data',
            method: "GET"
        }).success(function(data) {

          var types = ["html","css","javascript","image"];
          types.forEach(function(t) {
            mimeTypes[t] = [];
          });

          function checkType(type,key) {
            return (type.indexOf(key) !== -1 ? key : type);
          }

          function getData(record,metric) {
            return _.map(record.metrics[metric].data.log.entries,function(entry) {
              var type = entry.response.content.mimeType || "";
              types.forEach(function(t) {
                type = checkType(type,t);
              });

              return {
                size: (entry.cache.hasOwnProperty('afterRequest') ? 0 : entry.response.bodySize),
                type: type
              }
            });
          }

          data = _.map(data,function(record) {
            return {
              url: record.url,
              _id: record._id,
              cached: getData(record,'har'),
              uncached: getData(record,'harUncached'),
              time : {
                cached : [record.metrics.time.data.dt,(record.metrics.time.data.lt - record.metrics.time.data.dt)],
                uncached : [record.metrics.time.data.dt_u,(record.metrics.time.data.lt_u - record.metrics.time.data.dt_u)]
              }
            };
          });

          data.forEach(function(record,i) {
            types.forEach(function(t) {
              mimeTypes[t][i] = {
                url: record.url,
                _id: record._id,
                cached: _.filter(record.cached,function(entry) {
                  return entry.type === t;
                }),
                uncached: _.filter(record.uncached,function(entry) {
                  return entry.type === t;
                })
              }
            });
          });

          var size = {};
          var request = {};

          for(var s in sizes) {
            if(sizes.hasOwnProperty(s)) {
              types.forEach(function(t,i) {
                sizes[s][t] = [['URL','Size',{role: 'style'}]].concat(_.map(mimeTypes[t],function(record) {
                  return [
                    record.url + " (" + record._id + ")",
                    _.reduce(record[s],function(res,entry) {
                      return res + entry.size;
                    },0),
                    colors[i]
                  ];
                }));
                requests[s][t] = [['URL','Requests',{role: 'style'}]].concat(_.map(mimeTypes[t],function(record) {
                  return [
                    record.url + " (" + record._id + ")",
                    _.reduce(record[s],function(res,ent) {
                      return res+(ent.size > 0);
                    },0),
                    colors[i]
                  ];
                }));
              });

              size[s] = [];
              request[s] = [];

              var sizeHeadings = ['URL'];
              var requestHeadings = ['URL'];
              types.forEach(function(t) {
                sizeHeadings.push(t);
                requestHeadings.push(t);
              });
              size[s].push(sizeHeadings);
              request[s].push(sizeHeadings);

              data.forEach(function(record) {
                var vals = [record.url + " (" + record._id + ")"];
                types.forEach(function(t) {
                  vals.push(_.reduce(_.filter(record[s],function(entry) {
                    return entry.type === t;
                  }),function(res,ent) {
                    return res + ent.size;
                  },0))
                });
                size[s].push(vals);
                var reqs = [record.url + " (" + record._id + ")"];
                types.forEach(function(t) {
                  reqs.push(_.reduce(_.filter(record[s],function(entry) {
                    return entry.type === t;
                  }),function(res,ent) {
                    return res+(ent.size > 0);
                  },0))
                });
                request[s].push(reqs);
                time[s].push([record.url+" ("+record._id+")"].concat(record.time[s]));

              });

              var chart = new google.visualization.BarChart(document.getElementById('time-' + s));
              chart.draw(google.visualization.arrayToDataTable(time[s]),summaryConfig);

              chart = new google.visualization.BarChart(document.getElementById('size-' + s));
              chart.draw(google.visualization.arrayToDataTable(size[s]),summaryConfig);

              chart = new google.visualization.BarChart(document.getElementById('requests-' + s));
              chart.draw(google.visualization.arrayToDataTable(request[s]),summaryConfig);

              types.forEach(function(t) {
                var chart = new google.visualization.BarChart(document.getElementById('size-' + s + '-' + t));
                chart.draw(google.visualization.arrayToDataTable(sizes[s][t]),typeConfig);

                chart = new google.visualization.BarChart(document.getElementById('requests-' + s + '-' + t));
                chart.draw(google.visualization.arrayToDataTable(requests[s][t]),typeConfig);
              });
            }
          }

        });
    }

]);
