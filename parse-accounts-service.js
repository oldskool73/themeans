'use strict';
/**
 * @ngdoc service
 * @name creemWebApp.Accounts
 * @description
 * # Accounts
 * Shared service to deal with all accounts tasks.
 */
angular.module('tm.parseAccounts', [
  'tm.parse',
  'tm.localstorage'
]).factory('Settings', [
  'Parse',
  function (Parse) {
    return Parse.Object.extend('Settings');
  }
]).provider('tmAccounts', function () {
  var options = {
      settingsCacheKey: 'User/Settings',
      rolesCacheKey: 'User/Roles',
      settingEditCacheKey: 'User/Settings/Edit'
    };
  this.configure = function (configOptions) {
    angular.extend(options, configOptions);
  };
  this.$get = [
    '$q',
    '$timeout',
    'Settings',
    'Parse',
    'tmLocalStorage',
    '$log',
    '$state',
    function ($q, $timeout, Settings, Parse, tmLocalStorage, $log, $state) {
      var _self = this;
      // Authenticates User by checking if exists, and returns an array of role names that
      // the User belongs to.
      /////// DEPENDANCY: Parse Cloud Code Function that gets Parse User object, finds all
      /////////////////// roles that the user belongs to, and returns an array of role names.
      this.getUserRoles = function (user) {
        var deferred = $q.defer(), cacheKey = options.rolesCacheKey, roles;
        var userId = user.id || user.objectId;
        if (typeof userId === 'undefined') {
          $log.error('User has no id or objectId: cannot getUserRoles.');
          return deferred.reject({ message: 'Please try logging in again, or contact system admin.' });
        }
        Parse.Cloud.run('getUserRoles', { userId: userId }, {
          success: function (roleNamesArray) {
            tmLocalStorage.setObject(cacheKey, roleNamesArray);
            roles = tmLocalStorage.getObject(cacheKey, []);
            deferred.resolve(roles);
          },
          error: function () {
            $log.error('Parse Cloud Error: getUserRoles returned error.');
            deferred.reject();
          }
        });
        return deferred.promise;
      };
      // Extension of getUserRoles method. Handles all the error scenarios just leaving out
      // the actualy display message to be handled in the calling function.
      this.getUserRolesWithErrorHandling = function (user, mustHaveRoles) {
        var deferred = $q.defer();
        _self.getUserRoles(user).then(function (roles) {
          if (mustHaveRoles && !roles || !roles.length) {
            return fail();
          }
          deferred.resolve(roles);
        }, fail);
        function fail() {
          tmLocalStorage.clear();
          Parse.User.logOut();
          $state.go('login');
          deferred.reject();
        }
        return deferred.promise;
      };
      this.isUserInRole = function (roleName) {
        var roles = tmLocalStorage.getObject(options.rolesCacheKey, []);
        if (roles.indexOf(roleName) >= 0) {
          return true;
        }
        return false;
      };
      function getSettingsById(settingsId, edit) {
        var deferred = $q.defer(), settingsQuery = new Parse.Query(Settings), cacheKey = options.settingsCacheKey, ngSettings;
        if (edit) {
          cacheKey = options.settingsEditCacheKey;
        }
        $timeout(function () {
          var cache = tmLocalStorage.getObject(cacheKey);
          deferred.notify(cache);
        }, 0);
        settingsQuery.get(settingsId, {
          success: function (parseSettings) {
            var model = parseSettings.getNgModel();
            if (edit) {
              model = parseSettings.getNgFormModel();
            }
            tmLocalStorage.setObject(cacheKey, model);
            ngSettings = tmLocalStorage.getObject(cacheKey);
            deferred.resolve(ngSettings);
          },
          error: function (response, err) {
            $log.error('Parse Error: ' + err.message, err.code);
            deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
          }
        });
        return deferred.promise;
      }
      this.getSettingsByIdForEditing = function (settingsId) {
        return getSettingsById(settingsId, true);
      };
      this.getSettingsByIdForDisplay = function (settingsId) {
        return getSettingsById(settingsId, false);
      };
      this.updateSettings = function (ngSettings) {
        var deferred = $q.defer(), settings = new Settings(ngSettings, {
            ngModel: true,
            resetOpsQueue: false
          }), cacheKey = options.settingsEditCacheKey;
        settings.save(null, {
          success: function (settings) {
            tmLocalStorage.setObject(cacheKey, settings);
            settings = tmLocalStorage.getObject(cacheKey);
            deferred.resolve(settings);
          },
          error: function (response, err) {
            $log.error('Parse Error: ' + err.message, err.code);
            deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
          }
        });
        return deferred.promise;
      };
      return this;
    }
  ];
  return this;
});