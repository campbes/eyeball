/*global eyeballApp*/

eyeballApp.factory('fieldConfig',function(){

    return {
        overview : [
            {tool : 'time', metric : 'lt', name: 'Load time', format : 'time'},
            {tool : 'yslow', metric : 'o', name: 'YSlow'},
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'DomMonster'},
            {tool : 'validator', metric : 'COMPOSITE_info', name: 'Validator'}
        ],
        time : [
            {tool : 'time', metric : 'lt', name: 'Load time', format : 'time'},
            {tool : 'time', metric : 'dt', name: 'DOM load time', format : 'time'},
            {tool : 'time', metric : 'lt_u', name: 'Load time (uncached)', label : 'Load time (u/c)', format : 'time'},
            {tool : 'time', metric : 'dt_u', name: 'DOM load time (uncached)', label: 'DOM time (u/c)', format : 'time'}
        ],
        yslow : [
            {tool : 'yslow',metric : 'o', name : 'Overall'},
            {tool : 'yslow',metric : 'w', name : 'Page size', format : 'size', label : 'Size'},
            {tool : 'yslow',metric : 'w_c', name : 'Page size (cached)', format : 'size', label:'Size (c)'},
            {tool : 'yslow',metric : 'r', name : 'HTTP requests', label: 'Requests'},
            {tool : 'yslow',metric : 'r_c', name : 'HTTP requests (cached)', label: 'Requests (c)'}
        ] ,
        dommonster : [
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'Overall'},
            {tool : 'dommonster', metric : 'stats.elements', name : 'Elements'},
            {tool : 'dommonster', metric : 'stats.nodes', name : 'Nodes'},
            {tool : 'dommonster', metric : 'stats.text nodes', name : 'Text nodes', label:'Text'},
            {tool : 'dommonster', metric : 'stats.text node size', name : 'Text node size', label:'Text size'},
            {tool : 'dommonster', metric : 'stats.content percentage', name : 'Content Percentage', label:'Content'},
            {tool : 'dommonster', metric : 'stats.average nesting depth', name : 'Nesting'},
            {tool : 'dommonster', metric : 'stats.serialized DOM size', name : 'DOM size'}
        ],
        validator : [
            {tool : 'validator', metric : 'COMPOSITE_info', name : 'Overall'},
            {tool : 'validator', metric : 'info.errors', name : 'Errors'},
            {tool : 'validator', metric : 'info.warnings', name : 'Warnings'}
        ],
        history : [
            {tool : 'overview', name : 'Overview'},
            {tool : 'time', metric : 'lt', name: 'Load time', format : 'time'},
            {tool : 'yslow', metric : 'o', name: 'YSlow'},
            {tool : 'dommonster', metric : 'COMPOSITE_stats', name : 'DomMonster'},
            {tool : 'validator', metric : 'COMPOSITE_info', name: 'Validator'}
        ]
    };

});
