'use strict';

/**
 * @ngdoc directive
 * @name themeans.directive:parseLogin
 * @description
 * # Parse Login directive using angular matierial design library.
    ## Complete with create account and reset password.
 */
angular.module('tm.md-parse-login', ['tm.ionic-parse', 'ngMaterial'])
  .directive('mdParseLogin', function ($compile){

    var mdParseLogin = new Function();

    mdParseLogin.prototype.link = function(scope, element, attrs){
      var mainTmpl = '<div '+
        scope.mainContainerAttributes+
        ' ng-switch on="formModal"> '+
        // LOGIN
        '<md-content '+
          scope.loginMdContentAttributes+
          ' class="{{mdContentClass}} login" '+
          'ng-switch-when="login"> '+
          '<md-toolbar class="{{mdToolbarClass}}"> '+
            '<h2 class="{{mdToolbarToolsClass}}"> '+
              '<span>{{loginToolbarText}}</span> '+
            '</h2> '+
          '</md-toolbar> '+
          '<form ng-submit="loginFormOnSubmit($event)"> '+
            '<div '+
              'style="padding: 20px" '+
              scope.loginInputsAttributes+'>'+
              '<md-input-container layout-fill> '+
                '<label>Username</label> '+
                '<input '+
                  'type="text" '+
                  'ng-model="user.username"> '+
              '</md-input-container> '+
              '<md-input-container layout-fill> '+
                '<label>Password</label> '+
                '<input '+
                  'type="password" '+
                  'ng-model="user.password"> '+
              '</md-input-container> '+
            '</div> '+
            '<div style="padding: 20px; padding-bottom:0"> '+
              '<md-button '+
                'style="width:100%" '+
                'class="{{loginButtonClass}}"> '+
                '{{loginButtonText}} '+
              '</md-button> '+
            '</div> '+
          '</form> '+
          '<p '+
            'layout="row" '+
            'layout-align="center center" '+
            'id="forgot-password"> '+
            '<a style=\"cursor: pointer;\" ng-click="setFormModal(\'reset\')"> '+
              'Forgot password '+
            '</a> '+
          '</p> '+
          '<div style="padding: 20px;padding-top:0"> '+
            '<md-button '+
              'class="{{createButtonClass}}" '+
              'style="width:100%" '+
              'ng-click="setFormModal(\'create\')"> '+
              '{{createButtonText}} '+
            '</md-button> '+
         '</div> '+
        '</md-content> '+

        // CREATE ACCOUNT
        '<md-content '+
          scope.createMdContentAttributes+
          ' class="{{mdContentClass}} create-account" '+
          'ng-switch-when="create"> '+
          '<md-toolbar class="{{mdToolbarClass}}"> '+
            '<h2 class="{{mdToolbarToolsClass}}"> '+
              '<span class="md-flex">{{createToolbarText}}</span> '+
              '<md-button '+
                'style="width:20%;position:absolute;right:15px;top:16px;color:white;" '+
                'class="{{backButtonClass}}" '+
                'ng-click="setFormModal(\'login\')"> '+
                '{{backButtonText}} '+
              '</md-button> '+
           '</h2> '+
          '</md-toolbar> '+
          '<form ng-submit="createFormOnSubmit($event)"> '+
            '<div '+
              'style="padding: 20px" '+
              scope.createInputsAttributes+'>'+
              '<md-input-container layout-fill> '+
                '<label>Username</label> '+
                '<input '+
                  'type="text" '+
                  'ng-model="user.username"> '+
              '</md-input-container> '+
              '<md-input-container layout-fill> '+
                '<label>Email</label> '+
                '<input '+
                  'ng-model="user.email" '+
                  'type="email"> '+
              '</md-input-container> '+
              '<md-input-container layout-fill> '+
                '<label>Password</label> '+
                '<input '+
                  'ng-model="user.password" '+
                  'type="password"> '+
              '</md-input-container> '+
            '</div> '+
            '<div style="padding: 20px;"> '+
              '<md-button '+
                'style="width:100%" '+
                'class="{{submitButtonClass}}"> '+
                '{{submitButtonText}} '+
             '</md-button> '+
            '</div> '+
          '</form> '+
        '</md-content> '+

        // RESET PASSWORD
        '<md-content '+
          scope.resetMdContentAttributes+
          ' class="{{mdContentClass}} reset-password" '+
          'ng-switch-when="reset"> '+
          '<md-toolbar class="{{mdToolbarClass}}"> '+
            '<h2 class="{{mdToolbarToolsClass}}"> '+
              '<span>{{resetToolbarText}}</span> '+
              '<md-button '+
                'style="width:20%;position:absolute;right:15px;top:16px;color:white;" '+
                'class="{{backButtonClass}}" '+
                'ng-click="setFormModal(\'login\')"> '+
                '{{backButtonText}} '+
              '</md-button> '+
            '</h2> '+
          '</md-toolbar> '+
          '<form ng-submit="loginFormOnSubmit($event)"> '+
            '<div '+
              'style="padding: 20px" '+
              scope.resetInputsAttributes+'>'+
              '<md-input-container layout-fill> '+
                '<label>Email</label> '+
                '<input type="email" ng-model="user.email"> '+
              '</md-input-container> '+
            '</div> '+
            '<div style="padding: 20px;"> '+
              '<md-button '+
                'style="width:100%" '+
                'class="{{submitButtonClass}}"> '+
                '{{submitButtonText}} '+
              '</md-button> '+
            '</div> '+
          '</form> '+
        '</md-content> '+
      '</div>';

      var el       = angular.element(mainTmpl),
          compiled = $compile(el);

      element.append(el);

      compiled(scope);
    };
    mdParseLogin.prototype.controller = [
      '$scope',
      '$location',
      'Parse',
      '$mdToast',
      '$mdDialog',
      function ($scope, $location, Parse, $mdToast, $mdDialog) {
        // Set the user object in controller for better control, this is a backup.
        if (typeof $scope.user === 'undefined') {
          $scope.user = {};
        }
        $scope.toastPosition = {
          bottom: false,
          top: true,
          left: false,
          right: true
        };
        $scope.getToastPosition = function () {
          return Object.keys($scope.toastPosition).filter(function (pos) {
            return $scope.toastPosition[pos];
          }).join(' ');
        };
        $scope.showSimpleToast = function (toastContent) {
          $mdToast.show($mdToast.simple().content(toastContent).position($scope.getToastPosition()).hideDelay(1500));
        };
        // default for ng-switch.
        $scope.formModal = 'login';
        $scope.setFormModal = function (val) {
          $scope.formModal = val;
        };
        $scope.loginFormOnSubmit = function () {
          Parse.User.logIn($scope.user.username, $scope.user.password, {
            success: function (user) {
              // Do stuff after successful login.
              $scope.onLoginSuccess(user);
            },
            error: function (user, error) {
              if (error.code === 100) {
                $scope.showSimpleToast('Please check your internet connnection and try again.');
              }
              $scope.showSimpleToast(error.message);
            }
          });
        };
        $scope.resetFormOnSubmit = function () {
          Parse.User.requestPasswordReset($scope.user.email, {
            success: function () {
              // Password reset request was sent successfully
              $scope.showSimpleToast('An email with a link to reset your password has been sent.');
            },
            error: function (error) {
              if (error.code === 100) {
                $scope.showSimpleToast('Please check your internet connnection and try again.');
              }
              // Show the error message somewhere
              $scope.showSimpleToast(error.message);
            }
          });
        };
        $scope.createFormOnSubmit = function () {
          var user = new Parse.User();
          var keys = Object.keys($scope.user);
          for (var i = 0; i < keys.length; i++) {
            user.set(keys[i], $scope.user[keys[i]]);
          }
          user.signUp(null, {
            success: function (user) {
              // Hooray! Let them use the app now.
              $scope.onLoginSuccess(user);
            },
            error: function (user, error) {
              if (error.code === 100) {
                $scope.showSimpleToast('Please check your internet connnection and try again.');
              }
              // Show the error message somewhere and let the user try again.
              $scope.showSimpleToast(error.message);
            }
          });
        };
      }
    ];
    mdParseLogin.prototype.restrict = 'E';
    mdParseLogin.prototype.scope =  {
      user: '=',
      mainContainerAttributes: '=',
      mdContentClass: '=',
      mdToolbarClass: '=',
      mdToolbarToolsClass: '=',
      submitButtonClass: '=',
      submitButtonText: '=',
      backButtonClass: '=',
      backButtonText: '=',
      loginMdContentAttributes: '=',
      loginInputsAttributes: '=',
      loginButtonClass: '=',
      loginButtonText: '=',
      loginToolbarText: '=',
      createMdContentAttributes: '=',
      createInputsAttributes: '=',
      createButtonClass: '=',
      createButtonText: '=',
      createToolbarText: '=',
      resetMdContentAttributes: '=',
      resetInputsAttributes: '=',
      resetToolbarText: '=',
      onLoginSuccess: '='
    };

    return new mdParseLogin();
  });
