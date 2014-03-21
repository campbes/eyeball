/*global eyeballApp, eyeballAppConfig*/

eyeballApp.service('configResolver',['$http',
    function($http){
        var config = null;

        if(config) {
            return config;
        }
        config = $http({
            url : '/config',
            method : 'GET',
            cache : true
        }).success(function(res){

                function processFields(fields) {
                    var f, items, i=0;
                    // process the fields for backwards compat with current usage. Maybe simplify at some point
                    for (f in fields) {
                        if(fields.hasOwnProperty(f)) {
                            fields[f].tool = f;
                            if(fields[f].items) {
                                items = fields[f].items;
                                for(i=items.length-1;i>=0;i--) {
                                    if(typeof items[i] === "string") {
                                        items[i] = fields[items[i]];
                                    } else if (typeof items[i] === "object") {
                                        items[i].tool = f;
                                    }
                                }
                            }
                        }
                    }
                    return fields;
                }
                res.report.fields = processFields(res.report.fields);
                config = res;

            });

        return config;
    }
]);