'use strict';
/**
 * @ngdoc service
 * @name airplayPutioApp.localstorage
 * @description
 * # localstorage
 * Service in the airplayPutioApp.
 */
angular.module('tm.ionic-parse', ['ionic']).service('Parse', [
  '$q',
  '$window',
  '$ionicPlatform',
  function Parse($q, $window, $ionicPlatform) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var deferred = $q.defer(), self = this;
    // override this function using a provider in the application config
    this.getKeys = function () {
      return {
        applicationId: '',
        javaScriptKey: '',
        clientKey: ''
      };
    };
    var parse = $window.Parse;
    // Delete from the $window scope to ensure that we use the deps injection
    delete $window.Parse;
    parse.initialize(self.getKeys().applicationId, self.getKeys().javaScriptKey);
    $ionicPlatform.ready(function () {
      if ($window.parsePlugin) {
        var bridge = $window.parsePlugin;
        // Delete from the $window scope to ensure that we use the deps injection
        delete $window.parsePlugin;
        bridge.initialize(self.getKeys().applicationId, self.getKeys().clientKey, function () {
          deferred.resolve(bridge);
        }, function () {
          deferred.reject(bridge);
        });
      }
    });
    parse.nativeBridge = deferred.promise;
    return parse;
  }
]);