'use strict';
/**
 * @ngdoc directive
 * @name creemWebApp.directive:tagsInput
 * @description
 * # tagsInput
 */
angular.module('tm.tags-input', [])
.directive('tmTagsInput', function ($compile) {
  var template = {
    md: '<div>'+
      '<md-button '+
        'type="button" '+
        'ng-click="skillOnClick($index)" '+
        'ng-repeat="skill in ngModel track by $index" '+
        'style="display:inline-block;margin-right:4px;margin-bottom:4px" '+
        'class="md-primary md-raised">'+
          '{{skill}}'+
        '<md-icon '+
          'style="height:14px;width:14px;margin-left:6px;margin-top:-4px" '+
          'md-svg-icon="cancel">'+
        '</md-icon>'+
      '</md-button>'+
      '<div layout="row" layout-align="start end">'+
        '<md-input-container flex>'+
          '<label for="label">Skill</label>'+
          '<input type="text" '+
            'ng-keydown="inputOnKeyDown($event)" '+
            'id="label" ' +
            'ng-model="skill">'+
        '</md-input-container>'+
        '<md-input-container flex="20">'+
          '<md-button class="add-tab md-primary" '+
            'ng-click="addOnClick()" '+
            'type="button">'+
              'Add'+
          '</md-button>'+
        '</md-input-container>'+
      '</div>'+
    '</div>',
    ionic: '<label class="item item-input item-stacked-label item-text-wrap">'+
      '<span class="input-label">My current skills: </span>'+
      '<div>'+
        '<button class="button button-positive" '+
          'type="button" '+
          'ng-repeat="skill in ngModel track by $index" '+
          'ng-click="skillOnClick($index)" '+
          'style="margin: 0 4px 4px 0; ">'+
            '{{ skill }}&nbsp;&nbsp;'+
            '<i class="icon ion-close-circled"></i>'+
        '</button>'+
      '</div>'+
    '</label>'+
    '<label class="item item-input item-stacked-label">'+
      '<span class="input-label">Add a Skill: </span>'+
        '<input '+
          'type="text" '+
          'class="item-wrap" '+
          'style="width: 100%;height: 100px;" '+
          'placeholder="What skills do you have?" '+
          'ng-keydown="inputOnKeyDown($event)" '+
          'ng-model="skill">'+
      '</span>'+
    '</label>'
  };
  return {
    restrict: 'E',
    scope: {
      ngModel: '=',
      environment: '@'
    },
    link: function(scope, elem) { // @params(attr)
      if (scope.environment === 'ionic')
      {
        elem.append($compile(template.ionic)(scope));
        return;
      }
      elem.append($compile(template.md)(scope));
    },
    controller: function($scope){
      $scope.skill = '';

      $scope.addOnClick = function(){
        if (!$scope.ngModel || !Array.isArray($scope.ngModel))
        {
          $scope.ngModel = [];
        }
        var skill = $scope.skill;
        skill = skill.replace(/[^\w\s-]/ig,'');
        skill = skill.toLowerCase();

        if($scope.ngModel.indexOf(skill) < 0 && skill.length > 0)
        {
          $scope.ngModel.push(skill);
        }

        $scope.skill = '';
      };

      $scope.skillOnClick = function(index){
        $scope.$applyAsync(function(){
          $scope.ngModel.splice(index, 1);
        });
      };

      $scope.inputOnKeyDown = function($event){
        $event.stopPropagation();

        if($event.which === 13)
        {
          $scope.addOnClick();
          $event.preventDefault();
        }

        if($event.which === 8 && $scope.ngModel && !$scope.skill.length)
        {
          $scope.skillOnClick($scope.ngModel.length - 1);
        }
      };
    }
  };
});
