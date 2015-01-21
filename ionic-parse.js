'use strict';
/**
 * @ngdoc service
 * @name airplayPutioApp.localstorage
 * @description
 * # localstorage
 * Service in the airplayPutioApp.
 */
angular.module('tm.ionic-parse', []).provider('Parse', function ParseProvider() {
  // $ionicPlatform injected as default to support backwards compatibility. Configure without to
  // exclude for angular-web projects
  var options = {
      applicationId: '',
      javaScriptKey: '',
      clientKey: '',
      deps: [
        '$q',
        '$window',
        '$ionicPlatform'
      ]
    };
  var ngParse = function () {
    var $q = arguments[0], $window = arguments[1], $ionicPlatform = arguments[2], self = this, parse = $window.Parse;
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
    if (!$ionicPlatform) {
      return parse;
    }
    // parse initialize device on $ionicPlatform ready.
    var deferred = $q.defer();
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
    return parse;
  };
  this.configure = function (configOptions) {
    angular.extend(options, configOptions);
    if (typeof configOptions.deps !== 'undefined') {
      options.deps.push(ngParse);
      this.$get = options.deps;
    }
  };
  options.deps.push(ngParse);
  this.$get = options.deps;
  return this;
});