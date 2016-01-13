/*!
 * Angular service for ARIA live regions announcements
 *
 * Copyright (C) 2014 Deque Systems Inc., All Rights Reserved
 *
 * See the project LICENSE file for usage
 */

(function () {
    'use strict';
    var module;
    try {
        module = angular.module('ngA11y');
    } catch (err) {
        module = angular.module('ngA11y', []);
    }

    /**
     *
     * The a11yAnnounce Angular.js service supplies two functions for use by the Angular
     * application - politeAnnounce and assertiveAnnounce. politeAnnounce will announce using aria-live="polite"
     * and assertiveAnnounce will announce using aria-live="assertive". The a11Announce service uses 4 divs,
     * 2 for polite and 2 for assertive. This is to circumvent bugs in browsers that will stop announcing updates
     * to the same div if these are too repetitive.
     *
     */

    module.factory('nga11yAnnounce', [function () {
        function makePolite(n) {
            var politeAnnouncer = angular.element('<div>').attr({
                'id': 'nga11y-politeannounce' + n,
                'role': 'log',
                'aria-live': 'polite',
                'aria-relevant': 'additions',
                'style': OFFSCREEN
            });
            angular.element(document.body).append(politeAnnouncer);
            return politeAnnouncer;
        }

        function makeAssertive(n) {
            var assertiveAnnouncer = angular.element('<div>').attr({
                'id': 'nga11y-assertiveannounce' + n,
                'role': 'log',
                'aria-live': 'assertive',
                'aria-relevant': 'additions',
                'style': OFFSCREEN
            });
            angular.element(document.body).append(assertiveAnnouncer);
            return assertiveAnnouncer;
        }

        var announceFactory = {number: 2, pIndex: 0, aIndex: 0};
        var OFFSCREEN = 'border: 0;clip: rect(0 0 0 0);clip: rect(0, 0, 0, 0);' +
            'height: 1px;margin: -1px;overflow: hidden;padding: 0;' +
            'width: 1px;position: absolute;';

        announceFactory.politeAnnouncers = [];
        for (var i = 0; i < announceFactory.number; i++) {
            announceFactory.politeAnnouncers.push(makePolite(i));
        }
        announceFactory.assertiveAnnouncers = [];
        for (i = 0; i < announceFactory.number; i++) {
            announceFactory.assertiveAnnouncers.push(makeAssertive(i));
        }
        announceFactory.politeAnnounce = function (msg) {
            this.politeAnnouncers[this.pIndex].empty();
            this.pIndex += 1;
            this.pIndex = this.pIndex % this.number;
            this.politeAnnouncers[this.pIndex].append(angular.element('<p>').text(msg));
        };
        announceFactory.assertiveAnnounce = function (msg) {
            this.assertiveAnnouncers[this.aIndex].empty();
            this.aIndex += 1;
            this.aIndex = this.aIndex % this.number;
            this.assertiveAnnouncers[this.aIndex].append(angular.element('<p>').text(msg));
        };
        return announceFactory;
    }]);
}());
;/*!
 * Angular directive for controlling focus on route DOM updates
 *
 * Copyright (C) 2014 Deque Systems Inc., All Rights Reserved
 *
 * See the project LICENSE file for usage
 */

(function () {
    'use strict';
    var module;
    try {
        module = angular.module('ngA11y');
    } catch (err) {
        module = angular.module('ngA11y', []);
    }

    module.directive('nga11yFocus', ['$timeout', function ($timeout) {
        function hidden(elem) {
            return !elem.offsetWidth || !elem.offsetHeight;
        }

        return {
            restrict: 'A',
            link: function (scope, element) {
                $timeout(function () {
                    if (!document.activeElement ||
                        (document.activeElement &&
                        (hidden(document.activeElement) ||
                        document.activeElement.nodeName === 'BODY'))) {
                        // we lost our focus, correct that
                        if (hidden(element[0])) {
                            return;
                        }
                        if (!element[0].hasAttribute('tabindex')) {
                            element[0].setAttribute('tabindex', '0');
                        }
                        element[0].focus();
                    }
                }, 10);
            }
        };
    }]);
}());
;/*!
 * Angular Directives For Accessible Forms
 *
 * Copyright (C) 2014 Deque Systems Inc., All Rights Reserved
 *
 * See the project LICENSE file for usage
 */
(function () {
    'use strict';

    var module;
    try {
        module = angular.module('ngA11y');
    } catch (err) {
        module = angular.module('ngA11y', []);
    }

    /**
     * Reset (remove-all) aria-desribedby ids added by these directives
     * and optionally add a new ID
     *
     * @param {Object}      ctrl    The angular control object
     * @param {HTMLElement} elem    The HTML element
     * @param {String}        [newId] (optional) A new ID to add
     */
    function resetDescribedby(ctrl, elem, newId) {
        // older browsers return null if attribute doesn't exist
        var describedby = elem.getAttribute('aria-describedby') || '';
        var original = describedby;

        // remove all pre-existing desribedby ids - we don't just
        // set it to a null string in case other code is
        // using aria-describedby, so we remove them using the stored
        // array of ids on the ctrl object
        var previous = ctrl.describedby || [];
        for (var i = 0, len = previous.length; i < len; i++) {
            // replace all incidences of the id
            var replacer = new RegExp('(?:^|\\s)' + previous[i] + '(?!\\S)', 'g');
            describedby = describedby.replace(replacer, '');
        }
        ctrl.describedby = [];

        // add the optional new one
        if (newId) {
            // we only add the id if its not already there
            var match = new RegExp('(?:^|\\s)' + newId + '(?!\\S)');
            if (!match.test(describedby)) {
                // add the id to the list associated with the control
                ctrl.describedby.push(newId);
                // add the id to the aria-describedby attribute
                describedby += ' ' + newId;
            }
        }

        // only change the attribute if changes have been
        // made to the string
        if (describedby !== original) {
            elem.setAttribute('aria-describedby', describedby);
        }
    }

    /**
     * Directive to make aria-live announcements of validation errors
     */
    module.directive('nga11yValidation', ['$timeout', 'nga11yAnnounce', function ($timeout, nga11yAnnounce) {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                // get value of the (optional) nga11y-announce-delay attribute
                var debounceAttr = attrs.nga11yValidationDelay;

                var currentTimeout;
                //default to a 2s debounce
                scope.debounce = debounceAttr ? parseInt(debounceAttr, 10) : 2000;

                // check whether a validation message should be read out
                function check(message) {
                    $timeout(function () {
                        var input = element[0];

                        if (!input) {
                            return;
                        }

                        input.setAttribute('aria-invalid', ctrl.$invalid);

                        if (ctrl.$invalid) {

                            var announcement = message ? message : '';

                            // get value of announce-invalid attribute
                            var validationId = attrs.nga11yValidationId;
                            if (validationId) {

                                // get the element with this id
                                var validation = document.getElementById(validationId);
                                if (!validation) {
                                    return;
                                }

                                // check whether the validation element is shown or hidden
                                if (angular.element(validation).hasClass('ng-hide')) {
                                    // if hidden mark as valid
                                    resetDescribedby(ctrl, input);
                                } else {
                                    // if shown, then build on the announcement
                                    announcement += ' ' + validation.innerText;
                                    // and add describedby and mark invalid
                                    resetDescribedby(ctrl, input, validationId);
                                }
                            }

                            if (announcement !== '') {
                                nga11yAnnounce.assertiveAnnounce(announcement);
                            }
                        }

                    }, 0);

                }

                /**
                 * Validate on blur
                 */
                element.bind('blur', function () {
                    // cancel any outstanding validations
                    // triggered by keystrokes
                    if (currentTimeout) {
                        $timeout.cancel(currentTimeout);
                    }
                    check('Previous field invalid.');
                });

                /**
                 * Attach a validator to trigger an announcement
                 * on pausing of entering data
                 */
                ctrl.$parsers.unshift(function (viewValue) {
                    // cancel pre-exisiting timeouts
                    if (currentTimeout) {
                        $timeout.cancel(currentTimeout);
                    }
                    currentTimeout = $timeout(check, scope.debounce);
                    return viewValue;
                });

            }
        };
    }]);

    /**
     * Directive function for adding a focus method to
     * a control, which will focus the associated element
     */
    function controlFocusDirective() {
        return {
            restrict: 'E',
            require: '?ngModel',
            link: function (scope, elem, attr, ctrl) {
                if (ctrl) {
                    ctrl.focus = function () {
                        elem.focus();
                    };
                }
            }
        };
    }

    // apply the controlFocusDirective to various
    // native elements
    module.directive('input', controlFocusDirective);
    module.directive('textarea', controlFocusDirective);
    module.directive('select', controlFocusDirective);

    /**
     * Directive for accessible forms
     */
    module.directive('nga11yForm', ['$log', function ($log) {
        return {
            restrict: 'A',
            link: function (scope, elem, attr, ctrl) {

                // it must have a name attribute
                if (!attr.name) {
                    $log.error('nga11yForm must have a name attribute');
                    return;
                }

                // the form is found on the scope by
                // its name property
                var form = scope[attr.name];

                // add a function that can focus the first element
                // to the scope, it might be useful elsewhere
                scope.focusFirst = function () {
                    // makes use of the fact that the inputs
                    // are in the order they appear on the page
                    for (var key in form) {
                        if (form.hasOwnProperty(key) && key.indexOf('$') !== 0) {
                            var input = form[key];
                            if (input.$invalid) {
                                if (input.focus) {
                                    input.focus();
                                }
                                return true;
                            }
                        }
                    }
                    return false;
                };

                // handle any submit event
                elem.on('submit', function (e) {
                    if (scope.focusFirst()) {
                        e.preventDefault();
                    }
                });
            }
        };
    }]);
})();
;/*
 * (c) 2016
 *  License: MIT
 */
(function () {'use strict';
    /**
     * @ngdoc module
     * @name ngA11y
     * @description
     *
     * Directive capture focus within a modal
     *
     * The directive assumes we will add an attribute 'a11y-modal' to
     * a suitable container element of the modal, and an 'a11y-modal-closer'
     * to any suitable control that when clicked will close the modal.
     *
     */
    angular.module('ngA11y')
        /**
         * @ngdoc directive
         * @module ngA11y
         * @name nga11yModal
         * @restrict A
         *
         * @description
         */
        .directive('nga11yModal', ['$log','$ngA11y', function ($log,$ngA11y) {
            return {
                restrict: 'A',
                scope: {},
                controller: ['$element', '$scope', '$attrs', function ($element, $scope, $attrs) {
                  $scope.options = $ngA11y.modal;
                    var focusSelector = $ngA11y.modal.focusSelector;

                    /**
                     * Gets first and last focusable elements in a container
                     *
                     * @param {Object} container Angular element of the container
                     * @returns {Object}            An object with first and last properties
                     */
                    function getFocusable(container) {
                        var native = container[0].querySelectorAll(focusSelector);
                        var focusable = [];
                        for (var i = 0, len = native.length; i < len; i++) {
                            var focusableElement = native[i];
                            // should block aria-hidden elements
                            var ariaHidden = focusableElement.getAttribute('aria-hidden');
                            if (ariaHidden && ariaHidden.toLowerCase() === 'true') {
                                continue;
                            }
                            // should block tabindex of -1
                            var tabIndex = focusableElement.getAttribute('tabindex');
                            if (tabIndex && tabIndex === '-1') {
                                continue;
                            }

                            focusable.push(native[i]);
                        }


                        if (focusable.length > 0) {
                            return {
                                first: focusable[0],
                                last: focusable[focusable.length - 1]
                            };
                        }
                    }
                }],
                link: ['scope', 'element', 'attrs', 'ctrl', function (scope, element, attrs, ctrl) {
                    // make the container focusable
                    element.attr('tabindex', '-1');

                    // find the closer
                    var closer = element[0].querySelector('[nga11y-modal-closer]');

                    // bind a keydown to the container and we
                    // will attempt to use this to capture focus
                    element.on('keydown', function (e) {

                        // handle escape
                        if (e.which === 27) {
                            if (closer) {
                                angular.element(closer).triggerHandler('click');
                            }
                            return;
                        }

                        // we are now only interested in tab key presses
                        if (e.which !== 9) {
                            return;
                        }

                        // get focusable on each keypress in case of
                        // dynamic content
                        var focusable = ctrl.getFocusable(element);

                        if (focusable) {
                            if (focusable.first === focusable.last) {
                                // if we only have one focusable element then focus it
                                focusable.first.focus();
                                e.preventDefault();
                            } else if ((e.target === focusable.first) && e.shiftKey) {
                                // else cater for reverse wrapping
                                focusable.last.focus();
                                e.preventDefault();
                            } else if ((e.target === focusable.last) && !e.shiftKey) {
                                // finally cater for forward wrapping
                                focusable.first.focus();
                                e.preventDefault();
                            }
                        }

                    });
                }]
            };
        }]);
})();
;(function () {
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
