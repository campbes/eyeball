/*global eyeballApp, $*/

eyeballApp.factory('popover',function(){
    return {
        show : function(e,obj) {
            var el = $(obj);
            el.popover({
                html : true,
                content : $('#popoverContent').html(),
                placement: 'left',
                container : 'body',
                trigger : 'manual'
            }).popover('show');

        },
        hide : function(e,obj) {
            $(obj).popover('destroy');
        }
    };
});