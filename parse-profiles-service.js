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
  'CACHEKEYS',
  function ($q, Profile, Follow, Parse, tmLocalStorage, $timeout, md5, CACHEKEYS) {
    function getProfileById(profileId, edit) {
      var deferred = $q.defer(), profilesQuery = new Parse.Query(Profile), cacheKey = CACHEKEYS['profile'] + profileId, ngProfile, model, cache;
      if (edit) {
        cacheKey = CACHEKEYS['profile:edit'] + profileId;
      }
      $timeout(function () {
        cache = tmLocalStorage.getObject(cacheKey);
        deferred.notify(cache);
      }, 0);
      profilesQuery.get(profileId, {
        success: function (parseProfile) {
          model = parseProfile.getNgModel();
          if (edit) {
            model = parseProfile.getNgFormModel();
          }
          tmLocalStorage.setObject(cacheKey, model);
          ngProfile = tmLocalStorage.getObject(cacheKey);
          deferred.resolve(ngProfile);
        },
        error: function (response, err) {
          console.error('Parse Error: ', err);
          deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
        }
      });
      return deferred.promise;
    }
    this.getProfileByIdForEditing = function (profileId) {
      return getProfileById(profileId, true);
    };
    this.getProfileByIdForDisplay = function (profileId) {
      return getProfileById(profileId, false);
    };
    this.updateProfile = function (ngProfile) {
      var deferred = $q.defer(), profile = new Profile(ngProfile, {
          ngModel: true,
          resetOpsQueue: false
        });
      profile.save(null, {
        success: function (profile) {
          tmLocalStorage.setObject(CACHEKEYS['profile:edit'] + profile.id, profile.getNgFormModel());
          profile = tmLocalStorage.getObject(CACHEKEYS['profile:edit'] + profile.id);
          deferred.resolve(profile);
        },
        error: function (response, err) {
          console.error('Parse Error: ', err);
          deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
        }
      });
      return deferred.promise;
    };
    this.followProfile = function (following, user) {
      following = new Profile(following, {
        ngModel: true,
        resetOpsQueue: false
      });
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
      }, function (err) {
        console.error('Parse Error: ', err);
        deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
      });
      return deferred.promise;
    };
    this.unfollowProfile = function (profileIds) {
      var deferred = $q.defer(), query = new Parse.Query(Follow), hash = md5.createHash(profileIds.sort().join(''));
      query.equalTo('profileIdsHash', hash);
      query.find({
        success: function (response) {
          if (!response.length) {
            console.error('No Parse Follow object found.');
            deferred.reject({ message: 'Please contact support' });
            return;
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
                console.error('Parse Error: ', err);
                deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
              }
            });
          }
        },
        error: function (response, err) {
          console.error('Parse Error: ', err);
          deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
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
          console.error('Parse Error: ', err);
          deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
        }
      });
      return deferred.promise;
    };
    // Query for all other profiles with the Role of role argument string.
    this.getNeighbouringRoleSpecificProfiles = function (roleKey) {
      var deferred = $q.defer(), user = Parse.User.current() || {}, rolesQuery = new Parse.Query(Parse.Role), cache;
      $timeout(function () {
        cache = tmLocalStorage.getObject(CACHEKEYS['candidates'], []);
        deferred.notify(cache);
      }, 0);
      rolesQuery.equalTo('name', roleKey);
      rolesQuery.find().then(function (response) {
        if (response.length > 1) {
          console.error('Roles Error: There are duplicate roles in the database.');
          deferred.reject({ message: 'Something went wrong, please contact system admin.' });
          return;
        }
        var relation = response[0].relation(roleKey + 's'), relationQuery = relation.query();
        if (user.id) {
          relationQuery.notEqualTo(roleKey, user);
        }
        relationQuery.include('profile');
        relationQuery.find().then(function (response) {
          var profiles = [];
          for (var i = 0; i < response.length; i++) {
            profiles.push(response[i].get('profile'));
          }
          tmLocalStorage.setObject(CACHEKEYS['candidates'], profiles);
          profiles = tmLocalStorage.getObject(CACHEKEYS['candidates'], []);
          deferred.resolve(profiles);
        }, function (err) {
          console.error('Parse Error: ', err);
          deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
        });
      }, function (err) {
        console.error('Parse Error: ', err);
        deferred.reject({ message: 'Please try again in a few moments, or contact support.' });
      });
      return deferred.promise;
    };
  }
]);