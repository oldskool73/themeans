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
  .service('tmAccounts', function ( $q, Parse, tmLocalStorage ) {

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

          tmLocalStorage.setObject(user.id+'-roles', roles);
          roles = tmLocalStorage.getObject(user.id+'-roles');

          deferred.resolve(roles);
        },
        error: function (response, err){
          deferred.reject(err);
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
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };

    this.getUserSettings = function(userId){
      var deferred = $q.defer(),
          query    = new Parse.Query(Parse.User);

      query.get(userId, {
        success: function(response){
          deferred.resolve(response);
        },
        error: function(response, err){
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };
  });









