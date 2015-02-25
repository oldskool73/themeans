'use strict';
/**
 * @ngdoc directive
 * @name creemWebApp.directive:tagsInput
 * @description
 * # tagsInput
 */
angular.module('tm.jquery-tags', []).directive('tmTagsInput', function () {
  return {
    restrict: 'A',
    scope: {
      ngModel: '=',
      minChars: '=',
      maxChars: '=',
      placeholderColor: '=',
      containerWidth: '=',
      containerHeight: '=',
      defaultText: '='
    },
    link: function postLink(scope, element) {
      //@params(attr)
      var $tags = jQuery(element).tagsInput({
          height: scope.containerHeight,
          width: scope.containerWidth,
          onChange: function ($el) {
            if (typeof $el.val === 'function') {
              scope.$evalAsync(function () {
                scope.ngModel = new Array($el.val().toLowerCase());
              });
            }
          },
          interactive: true,
          defaultText: scope.defaultText,
          removeWithBackspace: true,
          minChars: scope.minChars,
          maxChars: scope.maxChars,
          placeholderColor: scope.placeholderColor
        });
      scope.$watch('ngModel', function (newVal, oldVal) {
        if (typeof oldVal === 'undefined') {
          oldVal = [];
        }
        if (newVal && newVal.sort().toString() !== oldVal.sort().toString()) {
          $tags.importTags('');
          $tags.importTags(scope.ngModel.toString());
        }
      });
    }
  };
});