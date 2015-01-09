'use strict';

/**
 * @ngdoc directive
 * @name tmscannerApp.directive:parseLogin
 * @description
 * # parseLogin
 */
angular.module('tm.ionic-parse-login',['tm.ionic-parse'])
  .directive('ionicParseLogin', function () {

    var mainTmpl = '<form ng-submit="loginFormOnSubmit($event)">'+
      '<div class="list">'+
        '<label class="item item-input">'+
          '<span class="input-label">'+
            'Username'+
          '</span>'+
          '<input '+
            'type="text" '+
            'ng-model="user.username">'+
        '</label>'+

        '<label class="item item-input">'+
          '<span class="input-label">'+
            'Password'+
          '</span>'+
          '<input '+
            'type="password" '+
            'ng-model="user.password">'+
        '</label>'+
      '</div>'+
      '<div class="padding-horizontal">'+
        '<button '+
          'class="button button-block {{signInButtonClass}}">'+
          '{{signInButtonText}}'+
        '</button>'+
        '<p class="text-center">'+
          '<a ng-click="forgotPasswordOnClick($event)">'+
            'Forgot password'+
          '</a>'+
        '</p>'+
      '</div>'+
    '</form>'+
    '<div class="padding-horizontal">'+
      '<p class="text-center">'+
        'OR'+
      '</p>'+
      '<button '+
        'class="button button-block {{createAccountButtonClass}}" '+
		    'ng-click="createAccountOnClick($event)">'+
        '{{createAccountButtonText}}'+
      '</button>'+
    '</div>';

    var createTmpl = '<ion-modal-view>'+
      '<ion-header-bar class="{{headerBarClass}}">'+
        '<h1 class="title">Create Account</h1>'+
        '<div class="button button-clear" ng-click="createAccountModal.hide()">'+
          '<span class="icon ion-close"></span>'+
        '</div>'+
      '</ion-header-bar>'+
      '<ion-content>'+
        '<form ng-submit="createFormOnSubmit($event)">'+
          '<div class="list">'+
            '<label class="item item-input">'+
              '<span class="input-label">'+
                'Email'+
              '</span>'+
              '<input '+
                'type="text" '+
                'ng-model="user.email">'+
            '</label>'+

            '<label class="item item-input">'+
              '<span class="input-label">'+
                'Username'+
              '</span>'+
              '<input '+
                'type="text" '+
                'ng-model="user.username">'+
            '</label>'+

            '<label class="item item-input">'+
              '<span class="input-label">'+
                'Password'+
              '</span>'+
              '<input '+
                'type="password" '+
                'ng-model="user.password">'+
            '</label>'+
          '</div>'+
          '<div class="padding">'+
            '<button '+
              'class="button button-block {{createButtonClass}}">'+
              '{{createButtonText}}'+
            '</button>'+
          '</div>'+
        '</form>'+
      '</ion-content>'+
    '</ion-modal-view>';

    var resetTmpl = '<ion-modal-view>'+
      '<ion-header-bar class="{{headerBarClass}}">'+
        '<h1 class="title">Enter Your Email</h1>'+
        '<div class="button button-clear" ng-click="resetPasswordModal.hide()">'+
          '<span class="icon ion-close"></span>'+
        '</div>'+
      '</ion-header-bar>'+
      '<ion-content>'+
        '<form ng-submit="resetFormOnSubmit($event)">'+
          '<div class="list">'+
            '<label class="item item-input">'+
              '<span class="input-label">'+
                'Email'+
              '</span>'+
              '<input '+
                'type="text" '+
                'ng-model="user.email">'+
            '</label>'+
          '</div>'+
          '<div class="padding">'+
            '<button '+
              'class="button button-block {{resetButtonClass}}">'+
              '{{resetButtonText}}'+
            '</button>'+
          '</div>'+
        '</form>'+
      '</ion-content>'+
    '</ion-modal-view>';

    return {
      template: mainTmpl,
      restrict: 'E',
      scope:{
        headerBarClass:'@',
      	signInButtonClass:'@',
        signInButtonText:'@',
      	createAccountButtonClass:'@',
        createAccountButtonText:'@',
      	createButtonClass:'@',
        createButtonText:'@',
      	resetButtonClass:'@',
        resetButtonText:'@',
        modalAnimation:'@',
        onLoginSuccess:'='
      },
      controller: function ($scope, $location, $ionicPopup, $ionicModal, $ionicLoading, Parse) {

        $scope.user = {
          username: '',
          password: ''
        };

        $scope.loginFormOnSubmit = function(){
          
          $ionicLoading.show({
            template: 'Loading...',
            duration: 10000
          });

          Parse.User.logIn($scope.user.username, $scope.user.password, {
            success: function(user) {
              // Do stuff after successful login.
              $ionicLoading.hide();
              $scope.onLoginSuccess(user);
            },
            error: function(user, error) {
              var message = error.message;
              if(error.code === 100)
              {
                message = 'Please check your internet connnection and try again.';
              }

              $ionicLoading.hide();
              $ionicPopup.alert({
                title: message
              });
            }
          });

        };
        
        $scope.resetPasswordModal = $ionicModal.fromTemplate(resetTmpl, {
          scope: $scope,
          animation: $scope.modalAnimation
        });
        $scope.forgotPasswordOnClick = function () {
          $scope.resetPasswordModal.show();
        };
        $scope.resetFormOnSubmit = function(){

          $ionicLoading.show({
            template: 'Loading...',
            duration: 10000
          });

          Parse.User.requestPasswordReset($scope.user.email, {
            success: function() {
              // Password reset request was sent successfully
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: 'An email with a link to reset your password has been sent.'
              }).then(function(){
                $scope.resetPasswordModal.hide();
              });
            },
            error: function(error) {
              var message = error.message;
              if(error.code === 100)
              {
                message = 'Please check your internet connnection and try again.';
              }
              // Show the error message somewhere
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: message
              });
            }
          });

        };

        $scope.createAccountModal = $ionicModal.fromTemplate(createTmpl, {
          scope: $scope,
          animation: $scope.modalAnimation
        });
        $scope.createAccountOnClick = function () {
          $scope.createAccountModal.show();
        };
        $scope.createFormOnSubmit = function(){
          
          $ionicLoading.show({
            template: 'Loading...',
            duration: 10000
          });

          var user = new Parse.User();
          user.set('username', $scope.user.username);
          user.set('password', $scope.user.password);
          user.set('email', $scope.user.email);
           
          user.signUp(null, {
            success: function(user) {
              // Hooray! Let them use the app now.
              $ionicLoading.hide();
              $scope.createAccountModal.hide();
              $scope.onLoginSuccess(user);
            },
            error: function(user, error) {
              var message = error.message;
              if(error.code === 100)
              {
                message = 'Please check your internet connnection and try again.';
              }
              // Show the error message somewhere and let the user try again.
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: message
              });
            }
          });

        };
      },
      link: function postLink(scope, element, attrs) {
        // element.text('this is the parseLogin directive');
      }
    };
  });
