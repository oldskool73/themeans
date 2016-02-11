'use strict';
/**
 * @ngdoc directive
 * @name themeans.directive:parseLogin
 * @description
 * # Parse Login directive using angular matierial design library.
    ## Complete with create account and reset password.
 */
angular.module('tm.md-parse-login', [
  'tm.parse',
  'ngMaterial'
]).directive('autoFocus', function () {
  return {
    link: {
      post: function postLink(scope, element, attr) {
        element[0].focus();
      }
    }
  };
}).directive('mdParseLogin', [
  '$compile',
  function ($compile) {
    var MdParseLogin = function () {
      return this;
    };
    MdParseLogin.prototype.link = function (scope, element) {
      //@params(scope, element, attrs)
      var mainTmpl = '<div ' + 'id="md-toast-parent" ' + scope.defaults.mainContainerAttributes + ' ng-switch="formType">' + '<md-toolbar ' + 'ng-if="!hideHeader" ' + 'ng-switch-when="login" ' + 'class="{{defaults.mdToolbarClass}}">' + '<div class="md-toolbar-tools">' + '<span>' + '{{defaults.loginToolbarText}}' + '</span>' + '</div>' + '</md-toolbar> ' + '<md-content ' + scope.defaults.loginMdContentAttributes + ' class="{{defaults.mdContentClass}} login" ' + 'ng-switch-when="login"> ' + '<form ng-submit="loginFormOnSubmit($event)"> ' + '<div ' + scope.defaults.loginInputsAttributes + '>' + '<md-input-container layout-fill> ' + '<label>Username</label> ' + '<input auto-focus ' + 'required ' + 'type="text" ' + 'ng-model="user.username"> ' + '</md-input-container> ' + '<md-input-container layout-fill> ' + '<label>Password</label> ' + '<input ' + 'required ' + 'type="password" ' + 'ng-model="user.password"> ' + '</md-input-container> ' + '</div> ' + '<div ' + 'layout="row" ' + 'layout-align="center center">' + '<md-button flex ' + 'type="submit" ' + 'class="{{defaults.loginButtonClass}}"> ' + '{{defaults.loginButtonText}} ' + '</md-button> ' + '</div> ' + '</form> ' + '<p ' + 'layout="row" ' + 'layout-align="center center" ' + 'style="cursor: pointer;">' + '<a ng-click="switchFormOnClick(\'reset\')"> ' + 'Forgot password ' + '</a> ' + '</p> ' + '<div ' + 'layout="row" ' + 'layout-align="center center">' + '<md-button flex ' + 'type="button" ' + 'ng-bind="defaults.createButtonText" ' + 'class="{{defaults.createButtonClass}}" ' + 'ng-click="switchFormOnClick(\'create\')"> ' + '</md-button> ' + '</div> ' + '</md-content> ' + '<md-toolbar ' + 'ng-if="!hideHeader" ' + 'ng-switch-when="create" ' + 'class="{{defaults.mdToolbarClass}}"> ' + '<div class="md-toolbar-tools">' + '<span> ' + '{{defaults.createToolbarText}} ' + '</span> ' + '</div>' + '</md-toolbar> ' + '<md-content ' + scope.defaults.createMdContentAttributes + ' class="{{defaults.mdContentClass}} create-account" ' + 'ng-switch-when="create"> ' + '<form name="createForm" ng-submit="createFormOnSubmit($event)"> ' + '<div ' + scope.defaults.createInputsAttributes + ' >' + '<span flex layout-fill ng-include="createFormIncludeUrl"></span>' + '<md-input-container layout-fill> ' + '<label>Username</label> ' + '<input ' + 'required ' + 'name="username" ' + 'type="text" ' + 'ng-model="user.username"> ' + '</md-input-container> ' + '<div layout-fill ng-messages="createForm.username.$error" style="color:maroon;padding:10px;">' + '<div ng-message="required">You did not enter a user name</div>' + '</div>' + '<md-input-container layout-fill> ' + '<label>Email</label> ' + '<input ' + 'required ' + 'name="email" ' + 'ng-model="user.email" ' + 'type="email"> ' + '</md-input-container> ' + '<div layout-fill ng-messages="createForm.email.$error" style="color:maroon;padding:10px">' + '<div ng-message="required">You did not enter your email address</div>' + '</div>' + '<md-input-container layout-fill> ' + '<label>Password</label> ' + '<input ' + 'required ' + 'name="password" ' + 'ng-model="user.password" ' + 'type="password"> ' + '</md-input-container> ' + '<div layout-fill ng-messages="createForm.password.$error" style="color:maroon;padding:10px">' + '<div ng-message="required">You did not enter a password</div>' + '</div>' + '</div> ' + '<div  layout="row" layout-align="space-around center"> ' + '<md-button flex ' + 'type="submit" ' + 'ng-disabled="!createForm.$valid" ' + 'class="{{defaults.submitButtonClass}}"> ' + '{{defaults.submitButtonText}} ' + '</md-button> ' + '<span flex="5"></span>' + '<md-button flex ' + 'type="button" ' + 'class="{{defaults.backButtonClass}}" ' + 'ng-click="switchFormOnClick(\'login\')"> ' + '{{defaults.backButtonText}} ' + '</md-button> ' + '</div> ' + '</form> ' + '</md-content> ' + '<md-toolbar ' + 'ng-if="!hideHeader" ' + 'ng-switch-when="reset" ' + 'class="{{defaults.mdToolbarClass}}"> ' + '<div class="md-toolbar-tools">' + '<span> ' + '{{defaults.resetToolbarText}}' + '</span> ' + '</div>' + '</md-toolbar> ' + '<md-content ' + scope.defaults.resetMdContentAttributes + ' class="{{defaults.mdContentClass}} reset-password" ' + 'ng-switch-when="reset"> ' + '<form ng-submit="resetFormOnSubmit($event)"> ' + '<div ' + scope.defaults.resetInputsAttributes + ' >' + '<md-input-container layout-fill> ' + '<label>Email</label> ' + '<input ' + 'required ' + 'type="email" ng-model="user.email"> ' + '</md-input-container> ' + '</div> ' + '<div layout="row" layout-align="space-around center"> ' + '<md-button flex ' + 'type="submit" ' + 'ng-bind="defaults.submitButtonText" ' + 'ng-class="defaults.submitButtonClass" ' + 'ng-disabled="!user.email" >' + '</md-button> ' + '<span flex="5"></span>' + '<md-button flex ' + 'type="button" ' + 'class="{{defaults.backButtonClass}}" ' + 'ng-click="switchFormOnClick(\'login\')"> ' + '{{defaults.backButtonText}} ' + '</md-button> ' + '</div> ' + '</form> ' + '</md-content> ' + '</div>';
      var el = angular.element(mainTmpl), compiled = $compile(el);
      element.append(el);
      compiled(scope);
    };
    MdParseLogin.prototype.controller = [
      '$scope',
      '$location',
      'Parse',
      '$mdToast',
      function ($scope, $location, Parse, $mdToast) {
        var defaults = $scope.defaults = {};
        defaults.mdToolbarClass = 'md-primary md-default-theme';
        defaults.mdContentClass = 'md-padding';
        defaults.submitButtonClass = 'md-raised md-primary md-default-theme';
        defaults.submitButtonText = 'Submit';
        defaults.backButtonClass = '';
        defaults.backButtonText = 'Back';
        defaults.loginInputsAttributes = 'layout="row" layout-sm="column"';
        defaults.loginButtonClass = 'md-raised md-primary md-default-theme';
        defaults.loginButtonText = 'Login';
        defaults.loginToolbarText = 'Enter your login details';
        defaults.createButtonClass = 'md-raised md-default-theme';
        defaults.createButtonText = 'Create Account';
        defaults.createToolbarText = 'Enter your details';
        defaults.createInputsAttributes = 'layout="column" layout-sm="column" layout-align="center center"';
        defaults.resetInputsAttributes = 'layout="row" layout-sm="column"';
        defaults.resetToolbarText = 'Enter your email address';
        angular.extend($scope.defaults, $scope);
        $scope.sending = false;
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
        $scope.showToastAlert = function (toastContent) {
          $scope.toastMessage = toastContent;
          var basicToastTemplate = '<md-toast>' + '<span flex>{{toastMessage}}</span>' + '</md-toast>';
          var toastConfig = {
              scope: $scope,
              preserveScope: true,
              bindToController: true,
              hideDelay: parseInt($scope.customToastHideDelay) || 6000,
              position: $scope.getToastPosition(),
              parent: $scope.toastParentElementId ? angular.element(document.getElementById($scope.toastParentElementId)) : angular.element(document.getElementById('md-toast-parent'))
            };
          if ($scope.customToastTemplateUrl) {
            toastConfig.templateUrl = $scope.customToastTemplateUrl;
          } else {
            toastConfig.template = basicToastTemplate;
          }
          $mdToast.show(toastConfig);
        };
        // default for ng-switch.
        $scope.formType = 'login';
        $scope.switchFormOnClick = function (val) {
          $scope.formType = val;
        };
        $scope.loginFormOnSubmit = function () {
          $scope.sending = true;
          if ($scope.usernameToLowercase) {
            $scope.user.username = $scope.user.username.toLowerCase();
          }
          Parse.User.logIn($scope.user.username, $scope.user.password, {
            success: function (user) {
              $scope.sending = false;
              // Do stuff after successful login.
              $scope.onLoginSuccess(user);
            },
            error: function (user, error) {
              // connection_failed
              if (error.code === 100) {
                $scope.showToastAlert('Please check your internet connnection and try again.');
                return;
              }
              // object_not_found
              if (error.code === 101) {
                $scope.showToastAlert('Incorrect username or password.');
                return;
              }
              $scope.showToastAlert(error.message);
            }
          });
        };
        $scope.resetFormOnSubmit = function () {
          Parse.User.requestPasswordReset($scope.user.email, {
            success: function () {
              $scope.sending = false;
              // Password reset request was sent successfully
              $scope.showToastAlert('An email with a link to reset your password has been sent.');
            },
            error: function (error) {
              $scope.sending = false;
              if (error.code === 100) {
                $scope.showToastAlert('Please check your internet connnection and try again.');
                return;
              }
              $scope.showToastAlert(error.message);
            }
          });
        };
        $scope.createFormOnSubmit = function () {
          var user = new Parse.User();
          var keys = Object.keys($scope.user);
          if ($scope.usernameToLowercase) {
            $scope.user.username = $scope.user.username.toLowerCase();
          }
          for (var i = 0; i < keys.length; i++) {
            user.set(keys[i], $scope.user[keys[i]]);
          }
          user.signUp(null, {
            success: function (user) {
              $scope.sending = false;
              // Hooray! Let them use the app now.
              // passes back boolean for any existing / new controller logic
              $scope.onLoginSuccess(user, true);
            },
            error: function (user, error) {
              $scope.sending = false;
              if (error.code === 100) {
                $scope.showToastAlert('Please check your internet connnection and try again.');
                return;
              }
              $scope.showToastAlert(error.message);
            }
          });
        };
      }
    ];
    MdParseLogin.prototype.restrict = 'E';
    MdParseLogin.prototype.scope = {
      user: '=',
      onLoginSuccess: '=',
      hideHeader: '=',
      usernameToLowercase: '=?',
      createFormIncludeUrl: '@',
      mainContainerAttributes: '@',
      mdContentClass: '@',
      mdToolbarClass: '@',
      submitButtonClass: '@',
      submitButtonText: '@',
      backButtonClass: '@',
      backButtonText: '@',
      loginMdContentAttributes: '@',
      loginInputsAttributes: '@',
      loginButtonClass: '@',
      loginButtonText: '@',
      loginToolbarText: '@',
      createMdContentAttributes: '@',
      createInputsAttributes: '@',
      createButtonClass: '@',
      createButtonText: '@',
      createToolbarText: '@',
      resetMdContentAttributes: '@',
      resetInputsAttributes: '@',
      resetToolbarText: '@'
    };
    return new MdParseLogin();
  }
]);