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
  .service('tmAccounts', function ( $q, $timeout, Settings, Parse, tmLocalStorage ) {
    var _self = this;
    // Checks that account & roles are functioning properly.
    this.userAuthentication = function(user){
      var deferred = $q.defer();

      user
      .fetch()
      .then(function () {

        _self
        .getUserRoles(user)
        .then(function (roles){
          // Fail safe, user accounts somehow has lost its role relations.
          if (!roles)
          {
            console.error('Error: cached user roles array has been deleted.');
            deferred.reject({ message: 'Please try again, or contact system admin' });
            return;
          }

        }, function (err){
          console.error('Parse Error: ', err);
          deferred.reject({ message: 'Please try again in a few moments.' });
        });

      }, function (err) {
        console.error('Parse User account doesn\'t exist', err);
        deferred.reject({
          message: 'Your account doesn\'t exist. If this is unexpected please contact support.'
        });
      });
      return deferred.promise;
    };

    // Returns an array of role names that the passed in Parse User belongs to.
    this.getUserRoles = function(user){
      var deferred   = $q.defer(),
          queryRoles = new Parse.Query(Parse.Role);

      queryRoles.equalTo('users', user);
      queryRoles.find({
        success: function (response){
          var roles = [];
          for (var i = 0; i < response.length; i++){

            roles.push(response[i].get('name'));
          }

          tmLocalStorage.setObject('user:roles:'+user.id, roles);
          roles = tmLocalStorage.getObject('user:roles:'+user.id, []);

          deferred.resolve(roles);
        },
        error: function (response, err){
          console.error('Parse Error: ', err);
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        }
      });
      return deferred.promise;
    };

    this.getUserById = function(userId){
      var deferred = $q.defer(),
          query    = new Parse.Query(Parse.User);

      query.get(userId, {
        success: function(response){
          deferred.resolve(response);
        },
        error: function(response, err){
          console.error('Parse Error: ', err);
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
          ngSettings, cacheKey = 'settings:display:'+settingsId;

      if(edit){
        cacheKey = 'settings:edit:'+settingsId;
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
          console.error('Parse Error: ', err);
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
          settings   = new Settings(ngSettings,{
            ngModel: true,
            resetOpsQueue: false
          });

      settings.save(null, {
        success: function(settings){
          tmLocalStorage.setObject(settings.id, settings);
          settings = tmLocalStorage.getObject(settings.id);
          deferred.resolve(settings);
        },
        error: function(response, err){
          console.error('Parse Error: ', err);
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        }
      });
      return deferred.promise;
    };
  });









