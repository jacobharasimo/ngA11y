(function (window, angular, undefined) {
    'use strict';
    /**
     * @ngdoc module
     * @name ngA11y
     * @description
     *     
     * Provider allows the user to set some constant values for ngAlly to funciton on.
     *
     */
    angular.module('ngA11y')

    .provider('$ngA11y', function() {
        var $ngA11yProvider={
            modal:{
                focusSelector:'a, input:not([hidden="true"]), [tabindex], select, button, textarea, area';
            },
            forms:{},
            focus:{},
            announce:{}
            
        };

        return $ngA11yProvider;
    });
})();