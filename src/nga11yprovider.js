(function () {
  'use strict';
  /**
   * @ngdoc module
   * @name ngA11y
   * @description
   *
   * Provider allows the user to set some constant values for ngAlly to funciton on.
   *
   */
  angular.module('ngA11y',[])

    .provider('$ngA11y', function () {

        this.options= {
          modal: {
            focusSelector: 'a, input:not([hidden="true"]), [tabindex], select, button, textarea, area'
          },
          forms: {},
          focus: {},
          announce: {}
        };

        this.$get= [function () {
          return this.options;
        }]

    });
})();
