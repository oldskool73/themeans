'use strict';

/**
 * @ngdoc directive
 * @name themeans.directive:tmMdSidenav
 * @description
 * # tmMdSidenav
    ## Configures md-sidenav to adjust to window height, and allows for dynamic md classes.
 */
angular.module('tm.md-sidenav', ['ngMaterial'])
  .directive('mdSidenav', function () {
    var mainTmpl = '<section layout="row" flex '+
      'class="side-nav-section" '+
      'style="display:inline-block; float:left;height:{{windowHeight}}"> '+
      '<md-sidenav '+
        'style="height:{{windowHeight}};" '+
        'class="{{mdSidenavClass}}" '+
        'md-component-id="{{mdComponentId}}" '+
        'md-is-locked-open="{{mdIsLockedOpen}}"> '+
        '<md-button '+
          'class="{{mdButtonClass}}" '+
          'ng-repeat="nav in navObjects track by $index"> '+
          '<a href="{{nav.url}}" style="text-decoration: none; color: inherit;"> '+
            '<h1 class="md-toolbar-tools">{{nav.title}}</h1> '+
          '</a> '+
        '</md-toolbar> '+
      '</md-sidenav> '+
    '</section>';

    return {
      controller: function ($scope, $window){
        // Sets the md-sidenav to the size of the window height,
        // less the height of a scoped element ($scope.offsetElementId).
        $scope.windowHeight = '';
        $scope.initializeWindowSize = function() {
          if (!$scope.offsetElementId)
          {
            return $scope.windowHeight = $window.innerHeight + 'px';
          }
          var el      = angular.element(document.getElementById($scope.offsetElementId)),
              offset  = el[0].offsetHeight;

          return $scope.windowHeight = ($window.innerHeight - offset) +'px';
        };
        $scope.initializeWindowSize();

        // resize the nav element on window resize.
        return angular.element($window).bind('resize', function() {
          $scope.initializeWindowSize();
          return $scope.$apply();
        });
      },
      template: mainTmpl,
      restrict: 'E',
      scope: {
        mdSidenavClass:'=',
        mdComponentId:'=',
        mdIsLockedOpen:'=',
        mdButtonClass:'=',
        navObjects:'=',
        offsetElementId:'='
      },
      link: function postLink(scope, element, attrs) {
      }
    };
  });
