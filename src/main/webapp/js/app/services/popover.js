/*global eyeballApp, $*/

eyeballApp.factory('popover',function(){
    return {
        show : function(e,obj) {
            var el = $(obj);
            el.popup({on : false});
            el.popup('hide');
            el.popup('setting','content',$('#popoverContent').html());
            el.popup('setting','variation','small');
            el.popup('setting','position','left center');
            el.data('delay',setTimeout(function() {
                  el.popup('show');
            },500));
        },
        hide : function(e,obj) {
            var el = $(obj);
            if(el.data('delay')) {
                clearTimeout(el.data('delay'));
            }
            el.popup('hide');
        }
    };
});