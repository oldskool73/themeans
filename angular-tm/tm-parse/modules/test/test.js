'use strict';

angular.module('tm.test', [])
  .directive('tm.test', function () {
    controller: function ($scope) {},
    template: '<div><h2>You have successfully included the tm.test component.</h2></div>',
    restrict: 'E',
    scope: {},
    link: function (scope, element, attrs) {}
  });
