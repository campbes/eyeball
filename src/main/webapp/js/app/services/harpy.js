/*global eyeballApp, Exos*/

eyeballApp.service('harpy',function() {

    var prop, cfg;

    var baseConfig = {
        backgroundColor: {fill:'transparent'},
        legend : {
            textStyle : {
                color: '#FFF'
            }
        },
        titleTextStyle : {
            color: '#FFF'
        },
        chartArea : {
            top :30,left: 10,bottom: 30,right: 10,width:300
        },
        diff : {
            oldData : {
                opacity : 0.7
            }
        },
        sliceVisibilityThreshold: 0
    };

    var config = {
        pie : {
            time : {
                colors : ['#d9534f','#F63','#F96','#9C9','#FC6','#5cb85c'],
                title : "Time"
            },
            type : {
                colors : ['#CCC','#FFB','#FBF','#BBF','#FBB'],
                title : "Content"
            },
            uncached : {
                colors : ['#CCC','#FFB','#FBF','#BBF','#FBB'],
                title : "Uncached content"
            },
            size : {
                colors : ['#5cb85c','#d9534f'],
                title : "Cache profile"
            }
        },
        bar : {
            colors : ['#5cb85c','#d9534f'],
            legend: "none",
            hAxis : {
                maxValue : 0,
                textStyle : {
                    color: '#FFF'
                }
            },
            backgroundColor: {fill:'transparent'},
            titleTextStyle : {
                color: '#FFF'
            },
            chartArea : {
                top :30,left: 10,bottom: 30,right: 10,width:300
            },
            dataOpacity : 0.9
        }
    };

    for(cfg in config.pie) {
        if(config.pie.hasOwnProperty(cfg)) {
            for(prop in baseConfig) {
                if(baseConfig.hasOwnProperty(prop) && !cfg[prop]) {
                    config.pie[cfg][prop] = baseConfig[prop];
                }
            }
        }
    }

    return config;

});