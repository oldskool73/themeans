'use strict';
/**
 * @ngdoc directive
 * @name creemWebApp.directive:tagsInput
 * @description
 * # tagsInput
 */
angular.module('tm.tags-input', []).directive('tmTagsInput', [
  '$compile',
  function ($compile) {
    var template = {
        md: '<div>' +
          '<md-button ' +
            'type="button" ' +
            'ng-click="tagOnClick($index)" ' +
            'ng-repeat="tag in tags track by $index" ' +
            'style="display:inline-block;margin-right:4px;margin-bottom:4px" ' +
            'class="md-primary md-raised">' +
              '{{tag}}' +
            '<md-icon ' +
              'style="height:14px;width:14px;margin-left:6px;margin-top:-4px" ' +
              'md-svg-icon="cancel">' +
            '</md-icon>' +
            '<md-tooltip>Click to remove</md-tooltop>'+
          '</md-button>' +
          '<div layout="row">' +
            '<md-input-container flex ng-if="!suggestive()">' +
            '<label for="label">{{inputLabel}}</label>' +
            '<input type="text" ' +
              'ng-keydown="inputOnKeyDown($event)" ' +
              'id="label" ' +
              'ng-model="tag.searchText">' +
            '</md-input-container>' +
            '<md-autocomplete ng-if="suggestive()" flex ' +
                'style="min-width: 0px;" ' +
                'ng-keydown="inputOnKeyDown($event)" ' +
                'md-no-cache="true" ' +
                'md-selected-item="tag.selectedText" ' +
                'md-search-text="tag.searchText" ' +
                'md-items="item in getMatches(tag.searchText)" ' +
                'md-item-text="item.display" ' +
                'md-floating-label="{{inputLabel}}">' +
              '<span md-highlight-text="tag.searchText">{{item.display}}</span>' +
            '</md-autocomplete>' +
            // '<md-button class="add-tab md-primary" flex="20" ' +
            //   'style="min-width: 0px;" ' +
            //   'ng-click="addOnClick()" ' +
            //   'type="button">' +
            //     'Add' +
            // '</md-button>' +
          '</div>' +
        '</div>',
        ionic: '<label class="item item-input item-stacked-label item-text-wrap">' +
          '<span class="input-label">My current skills: </span>' +
          '<div>' +
            '<button class="button button-positive" ' +
              'type="button" ' +
              'ng-repeat="tag in tags track by $index" ' +
              'ng-click="tagOnClick($index)" ' +
              'style="margin: 0 4px 4px 0; ">' +
                '{{tag}}&nbsp;&nbsp;' +
              '<i class="icon ion-close-circled"></i>' +
            '</button>' +
          '</div>' +
        '</label>' +
        '<label class="item item-input item-stacked-label">' +
          '<span class="input-label">Add a Skill: </span>' +
          '<input ' +
            'type="text" ' +
            'class="item-wrap" ' +
            'placeholder="What skills do you have?" ' +
            'ng-keydown="inputOnKeyDown($event)" ' +
            'ng-model="tag.searchText">' +
        '</label>'
      };
    return {
      restrict: 'E',
      scope: {
        tags: '=ngModel',
        environment: '@',
        suggestive: '&',
        suggestions: '=?',
        inputLabel: '@'
      },
      link: function (scope, elem) {
        // @params(attr)
        if (scope.environment === 'ionic') {
          elem.append($compile(template.ionic)(scope));
          return;
        }
        elem.append($compile(template.md)(scope));
      },
      controller: [
        '$scope',
        function ($scope) {
          $scope.inputLabel = $scope.inputLabel ? $scope.inputLabel : 'Add a Tag';

          var defaultTag = {
              searchText: '',
              selectedText: {
                display: '',
                value: ''
              }
            };

          $scope.tag = angular.copy(defaultTag);

          $scope.getMatches = function (query) {
            $scope.suggestions = $scope.suggestions ? $scope.suggestions : [];
            return query ? $scope.suggestions.filter(createFilterFor(query)) : [];
          };

          function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(suggestion) {
              return suggestion.value.indexOf(lowercaseQuery) === 0;
            };
          }

          $scope.addOnClick = function () {
            if (!$scope.tags || !Array.isArray($scope.tags))
            {
              $scope.tags = [];
            }
            // no suggested value was selected.
            if ($scope.suggestive() && !$scope.tag.selectedText)
            {
              return;
            }
            var tag = $scope.tag.selectedText.value || $scope.tag.searchText || '';
            if (!$scope.suggestive()) {
              tag = tag.replace(/[^\w\s-]/gi, '');
            }
            tag = tag.toLowerCase();

            if ($scope.tags.indexOf(tag) < 0 && tag.length > 0)
            {
              $scope.tags.push(tag);
            }
            $scope.tag = angular.copy(defaultTag);
          };
          $scope.tagOnClick = function (index) {
            $scope.$applyAsync(function () {
              $scope.tags.splice(index, 1);
            });
          };
          $scope.inputOnKeyDown = function ($event) {
            $event.stopPropagation();

            if ($event.which === 13)
            {
              $scope.addOnClick();
              $event.preventDefault();
            }
            if ($event.which === 8 && $scope.tags && !$scope.tag.searchText.length)
            {
              $scope.tagOnClick($scope.tags.length - 1);
            }
          };
          // adds tags on md-suggestions click select
          $scope.$watch('tag.searchText', function (item) {
            if ($scope.tag && $scope.tag.selectedText && $scope.tag.selectedText.value) {
              $scope.addOnClick();
            }
          });
        }
      ]
    };
  }
]);
