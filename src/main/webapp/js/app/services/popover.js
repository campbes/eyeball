/*global eyeballApp, $*/

eyeballApp.factory('popover',function(){
    return {
        show : function(e,obj) {
            var el = $(obj);
            el.popup('hide');
            el.popup({on : false});
            el.popup('setting','content',$('#popoverContent').html());
            el.popup('setting','variation','small');
            el.popup('setting','position','left center');
            el.popup('show');
        },
        hide : function(e,obj) {
            $(obj).popup('hide');
        }
    };
});