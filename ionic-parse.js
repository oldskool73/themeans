'use strict';
/**
 * @ngdoc service
 * @name airplayPutioApp.localstorage
 * @description
 * # localstorage
 * Service in the airplayPutioApp.
 */
angular.module('tm.ionic-parse', ['ionic']).provider('Parse', function ParseProvider() {
  var options = {
      applicationId: '',
      javaScriptKey: '',
      clientKey: ''
    };
  this.configure = function (configOptions) {
    angular.extend(options, configOptions);
  };
  this.$get = function (options) {
    return function ($q, $window, $ionicPlatform) {
      // AngularJS will instantiate a singleton by calling "new" on this function
      var deferred = $q.defer(), self = this;
      var parse = $window.Parse;
      // Delete from the $window scope to ensure that we use the deps injection
      delete $window.Parse;
      parse.initialize(options.applicationId, options.javaScriptKey);
      parse.Object.prototype.getNgModel = function () {
        var self = this, key, child;
        for (key in self.attributes) {
          child = self.get(key);
          if (typeof child.getNgModel === 'function') {
            self.set(key, child.getNgModel());
          } else if (Array.isArray(child)) {
            for (var i = 0; i < child.length; i++) {
              if (typeof child[i].getNgModel === 'function') {
                child[i] = child[i].getNgModel();
              }
            }
          }
        }
        return angular.fromJson(angular.toJson(self));
      };
      $ionicPlatform.ready(function () {
        if ($window.parsePlugin) {
          var bridge = $window.parsePlugin;
          // Delete from the $window scope to ensure that we use the deps injection
          delete $window.parsePlugin;
          bridge.initialize(options.applicationId, options.clientKey, function () {
            deferred.resolve(bridge);
          }, function () {
            deferred.reject(bridge);
          });
        }
      });
      parse.nativeBridge = deferred.promise;
      // onNotificationAPN...
      return parse;
    };
  }(options);
});