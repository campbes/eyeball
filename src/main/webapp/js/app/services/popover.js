/*global eyeballApp, $*/

eyeballApp.factory('popover',function(){

    function show(e,obj) {
        var el = $(obj);
        el.popup({on : false});
        hide(e,obj);
        el.popup('setting','content',$('#popoverContent').html());
        el.popup('setting','variation','small');
        el.popup('setting','position','left center');
        el.data('delay',setTimeout(function() {
            el.popup('show');
        },500));
    }

    function hide(e,obj) {
        var el = $(obj);
        if(el.data('delay')) {
            clearTimeout(el.data('delay'));
        }
        el.popup('remove');
    }

    return {
        show : show,
        hide : hide
    };
});