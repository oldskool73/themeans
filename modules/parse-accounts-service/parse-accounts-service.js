'use strict';

/**
 * @ngdoc service
 * @name creemWebApp.Accounts
 * @description
 * # Accounts
 * Shared service to deal with all accounts tasks.
 */
angular.module('tm.parseAccounts',[
    'tm.parse',
    'tm.localstorage'
  ])
  .factory('Settings',function (Parse){
    return Parse.Object.extend('Settings');
  })
  .provider('tmAccounts', function () {

    var options = {
      settingsCacheKey: 'User/Settings',
      rolesCacheKey: 'User/Roles',
      settingEditCacheKey: 'User/Settings/Edit',
    };

    this.configure = function (configOptions) {
      angular.extend(options, configOptions);
    };

    this.$get = [ '$q', '$timeout', 'Settings', 'Parse', 'tmLocalStorage', '$log',
    function ( $q, $timeout, Settings, Parse, tmLocalStorage, $log ) {

      // Authenticates User by checking if exists, and returns an array of role names that
      // the User belongs to.
      /////// DEPENDANCY: Parse Cloud Code Function that gets Parse User object, finds all
      /////////////////// roles that the user belongs to, and returns an array of role names.
      this.getUserRoles = function(user) {
        var deferred = $q.defer(),
            cacheKey = options.rolesCacheKey,
            roles;

        var userId   = user.id || user.objectId;

        if (typeof userId === 'undefined') {
          deferred.reject({
            message: 'Please try logging in again, or contact system admin.'
          });
        }

        Parse.Cloud.run('getUserRoles', {
          userId: userId
        }, {
          success: function(roleNamesArray) {
            tmLocalStorage.setObject(cacheKey, roleNamesArray);
            roles = tmLocalStorage.getObject(cacheKey, []);

            deferred.resolve(roles);
          },
          error: function(err) {
            $log.error('Parse Cloud Error: ' + err.message);
            deferred.reject({
              message: 'Please try logging in again, or contact system admin.'
            });
          }
        });
        return deferred.promise;
      };

      this.isUserInRole = function(roleName) {
        var roles = tmLocalStorage.getObject(options.rolesCacheKey, []);

        if (roles.indexOf(roleName) >= 0) {
          return true;
        }
        return false;
      };

      this.getUserById = function(userId){
        var deferred = $q.defer(),
            query    = new Parse.Query(Parse.User);

        query.get(userId, {
          success: function(response){
            deferred.resolve(response);
          },
          error: function(response, err){
            $log.error('Parse Error: ' + err.message, err.code);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      function getSettingsById(settingsId, edit){
        var deferred      = $q.defer(),
            settingsQuery = new Parse.Query(Settings),
            cacheKey      = options.settingsCacheKey,
            ngSettings;

        if(edit){
          cacheKey = options.settingsEditCacheKey;
        }

        $timeout(function (){
          var cache = tmLocalStorage.getObject(cacheKey);
          deferred.notify(cache);
        }, 0);

        settingsQuery.get(settingsId, {
          success: function(parseSettings) {
            var model = parseSettings.getNgModel();
            if (edit) {
              model = parseSettings.getNgFormModel();
            }
            tmLocalStorage.setObject(cacheKey, model);
            ngSettings = tmLocalStorage.getObject(cacheKey);
            deferred.resolve(ngSettings);
          },
          error: function(response, err){
            $log.error('Parse Error: ' + err.message, err.code);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      }

      this.getSettingsByIdForEditing = function(settingsId){
        return getSettingsById(settingsId, true);
      };

      this.getSettingsByIdForDisplay = function(settingsId){
        return getSettingsById(settingsId, false);
      };

      this.updateSettings = function(ngSettings){
        var deferred  = $q.defer(),
            settings  = new Settings(ngSettings,{
              ngModel: true,
              resetOpsQueue: false
            }),
            cacheKey  = options.settingsEditCacheKey;

        settings.save(null, {
          success: function(settings){
            tmLocalStorage.setObject(cacheKey, settings);
            settings = tmLocalStorage.getObject(cacheKey);
            deferred.resolve(settings);
          },
          error: function(response, err){
            $log.error('Parse Error: ' + err.message, err.code);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      return this;
    }];

    return this;
  });
