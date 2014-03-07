eyeballApp.factory('utils',['exos',
    function(exos) {

        function popover(pop) {
            exos.enable([
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

        function scrollTo(anchor){

            anchor = $("#"+anchor);

            if(anchor) {
                $('body').animate({
                    scrollTop : anchor.offset().top
                });
            }
        }

        return {
            popover : popover,
            scrollTo : scrollTo
        }
    }
]);