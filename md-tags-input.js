'use strict';
/**
 * @ngdoc directive
 * @name creemWebApp.directive:tagsInput
 * @description
 * # tagsInput
 */
angular.module('tm.md-tags-input', []).directive('tmTagsInput', [
  '$window',
  function ($window) {
    return {
      template: '<div>' + '<md-button ' + 'type="button" ' + 'ng-click="skillOnClick($index)" ' + 'ng-repeat="skill in ngModel track by $index" ' + 'style="display:inline-block;margin-right:4px;margin-bottom:4px" ' + 'class="md-raised md-primary">' + '{{skill}}' + '<md-icon ' + 'style="height:14px;width:14px;margin-left:6px;margin-top:-4px" ' + 'md-svg-icon="cancel">' + '</md-icon>' + '</md-button>' + '<div layout="row" layout-align="start end">' + '<md-input-container>' + '<label for="label">Skill</label>' + '<input type="text" ' + 'ng-keydown="inputOnKeyDown($event)" ' + 'id="label" ng-model="skill">' + '</md-input-container>' + '<md-input-container>' + '<md-button class="add-tab md-primary" ' + 'ng-click="addOnClick()" ' + 'type="button">' + 'Add' + '</md-button>' + '</md-input-container>' + '</div>' + '</div>',
      restrict: 'EA',
      replace: true,
      scope: { ngModel: '=' },
      controller: [
        '$scope',
        function ($scope) {
          $scope.skill = '';
          $scope.addOnClick = function () {
            if (typeof $scope.ngModel === 'undefined') {
              $scope.ngModel = [];
            }
            var skill = $scope.skill;
            skill = skill.replace(/[^\w\s-]/gi, '');
            skill = skill.toLowerCase();
            if ($scope.ngModel.indexOf(skill) < 0) {
              $scope.ngModel.push(skill);
            }
            $scope.skill = '';
          };
          $scope.skillOnClick = function (index) {
            $scope.$applyAsync(function () {
              $scope.ngModel.splice(index, 1);
            });
          };
          $scope.inputOnKeyDown = function ($event) {
            $event.stopPropagation();
            if ($event.which === 13) {
              $scope.addOnClick();
              $event.preventDefault();
            }
            if ($event.which === 8 && $scope.ngModel) {
              $scope.skillOnClick($scope.ngModel.length - 1);
            }
          };
        }
      ]
    };
  }
]);