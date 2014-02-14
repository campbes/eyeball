/*global eyeballApp, Exos*/

eyeballApp.factory('exos',function() {

    function popover(pop) {
        Exos.enable([
            {'td[data-type="grades"]' : {
                'mouseenter' : {
                    fn : pop.show
                },
                'mouseleave' : {
                    fn : pop.hide
                },
                'click' : {
                    fn : pop.hide
                }
            }}
        ]);

    }

    return {
        popover : popover,
        enable : Exos.enable
    };

});