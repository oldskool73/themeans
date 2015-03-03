'use strict';
/**
 * @ngdoc service
 * @name creemWebApp.shared/profilerelations
 * @description
 * # shared/profilerelations
 * Service in the creemWebApp.
 */
angular.module('tm.parseProfiles', [
  'angular-md5',
  'tm.parse',
  'tm.localstorage'
]).factory('Profile', [
  'Parse',
  function (Parse) {
    return Parse.Object.extend('Profile');
  }
]).factory('Follow', [
  'Parse',
  function (Parse) {
    return Parse.Object.extend('Follow');
  }
]).service('tmProfiles', [
  '$q',
  'Profile',
  'Follow',
  'Parse',
  'tmLocalStorage',
  '$timeout',
  'md5',
  function ($q, Profile, Follow, Parse, tmLocalStorage, $timeout, md5) {
    this.getProfileById = function (profileId, returnParseObject) {
      var deferred = $q.defer(), profilesQuery = new Parse.Query(Profile), ngProfile;
      $timeout(function () {
        var cache = tmLocalStorage.getObject(profileId);
        deferred.notify(cache);
      }, 0);
      profilesQuery.get(profileId, {
        success: function (parseProfile) {
          tmLocalStorage.setObject(profileId, parseProfile);
          ngProfile = tmLocalStorage.getObject(profileId);
          // Gives back parse object setting faster pointers.
          if (returnParseObject) {
            return deferred.resolve({
              ngProfile: ngProfile,
              parseProfile: parseProfile
            });
          }
          deferred.resolve(ngProfile);
        },
        error: function (response, err) {
          if (err === null) {
            deferred.reject({ message: 'Could not find profile, please contact system admin.' });
          }
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };
    this.updateProfile = function (profileModel) {
      var deferred = $q.defer(), profile = new Profile();
      if (profileModel.skills) {
        profileModel.skills = profileModel.skills[0].split(',');
      }
      profile.save(profileModel, {
        success: function (profile) {
          tmLocalStorage.setObject(profile.id, profile);
          profile = tmLocalStorage.getObject(profile.id);
          deferred.resolve(profile);
        },
        error: function (response, err) {
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };
    this.followProfile = function (following, user) {
      var deferred = $q.defer(), follow = new Follow(), followACL = new Parse.ACL(), follower = user.get('profile'), hash = md5.createHash([
          following.id,
          follower.id
        ].sort().join(''));
      follow.set('follower', follower);
      follow.set('following', following);
      follow.set('profileIdsHash', hash);
      followACL.setPublicReadAccess(true);
      followACL.setWriteAccess(user, true);
      follow.setACL(followACL);
      follow.save().then(function () {
        deferred.resolve();
      }, function (response, err) {
        deferred.reject(err);
      });
      return deferred.promise;
    };
    this.unfollowProfile = function (profileIds) {
      var deferred = $q.defer(), query = new Parse.Query(Follow), hash;
      hash = hash = md5.createHash(profileIds.sort().join(''));
      query.equalTo('profileIdsHash', hash);
      query.find({
        success: function (response) {
          if (!response.length) {
            return deferred.reject('Something went wrong, please contact system admin');
          }
          // On the slim chance there are duplicates..
          for (var i = 0; i < response.length; i++) {
            obliterate(response[i]);
            if (i === response.length - 1) {
              deferred.resolve();
            }
          }
          function obliterate(follow) {
            follow.destroy({
              success: function () {
              },
              error: function (response, err) {
                deferred.reject(err);
              }
            });
          }
        },
        error: function (response, err) {
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };
    this.checkIfFollowExists = function (profileIds) {
      var deferred = $q.defer(), query = new Parse.Query(Follow), hash;
      hash = md5.createHash(profileIds.sort().join(''));
      query.equalTo('profileIdsHash', hash);
      query.find({
        success: function (response) {
          if (!response.length) {
            return deferred.resolve(false);
          }
          deferred.resolve(true);
        },
        error: function (err) {
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };
    // Query for all other profiles with the Role of "User".
    this.getNeighbourUserProfiles = function (user) {
      var deferred = $q.defer(), rolesQuery = new Parse.Query(Parse.Role);
      $timeout(function () {
        var cache = tmLocalStorage.getObject('profiles');
        deferred.notify(cache);
      }, 0);
      rolesQuery.equalTo('name', 'user');
      rolesQuery.find().then(function (response) {
        if (response.length > 1) {
          // console.log('ERROR: There are duplicate roles');
          deferred.reject({ message: 'Something went wrong, please contact system admin.' });
          return;
        }
        var relation = response[0].relation('users'), relationQuery = relation.query();
        // Just incase at any point a user can have both a business and user account.
        // They will not appear in the list of profiles.
        relationQuery.notEqualTo('users', user);
        relationQuery.include('profile');
        relationQuery.find().then(function (response) {
          var profiles = [];
          for (var i = 0; i < response.length; i++) {
            profiles.push(response[i].get('profile'));
          }
          tmLocalStorage.setObject('profiles', profiles);
          profiles = tmLocalStorage.getObject('profiles');
          deferred.resolve(profiles);
        }, function (err) {
          deferred.reject(err);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    };
  }
]);