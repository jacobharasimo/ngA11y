
(function () {
    'use strict';
    angular.module('ngA11y')

    .directive('nga11yFocus', ['$timeout', function ($timeout) {
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
