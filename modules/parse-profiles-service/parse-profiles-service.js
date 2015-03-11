'use strict';

/**
 * @ngdoc service
 * @name creemWebApp.shared/profilerelations
 * @description
 * # shared/profilerelations
 * Service in the creemWebApp.
 */
angular.module('tm.parseProfiles',[
    'angular-md5',
    'tm.parse',
    'tm.localstorage'
  ])
  .factory('Profile',function (Parse){
    return Parse.Object.extend('Profile');
  })
  .factory('Follow',function (Parse){
    return Parse.Object.extend('Follow');
  })
  .service('tmProfiles', function ( $q, Profile, Follow, Parse, tmLocalStorage, $timeout, md5 ) {

    function getProfileById(profileId, edit){
      var deferred      = $q.defer(),
          profilesQuery = new Parse.Query(Profile),
          ngProfile, cacheKey = 'profile:display:'+profileId;

      if (edit) {
        cacheKey = 'profile:edit:'+profileId;
      }

      $timeout(function (){
        var cache = tmLocalStorage.getObject(cacheKey);
        deferred.notify(cache);
      }, 0);

      profilesQuery.get(profileId, {
        success: function(parseProfile) {
          var model = parseProfile.getNgModel();
          if (edit) {
            model = parseProfile.getNgFormModel();
          }
          tmLocalStorage.setObject(cacheKey, model);
          ngProfile = tmLocalStorage.getObject(cacheKey);
          deferred.resolve(ngProfile);
        },
        error: function(response, err){
          console.error('Parse Error: ', err.code, err.message);
          deferred.reject(err);
        }
      });
      return deferred.promise;
    }

    this.getProfileByIdForEditing = function(profileId){
      return getProfileById(profileId, true);
    };

    this.getProfileByIdForDisplay = function(profileId){
      return getProfileById(profileId, false);
    };

    this.updateProfile = function(ngProfile){
      var deferred  = $q.defer(),
          profile   = new Profile(ngProfile, {
            ngModel:true,
            resetOpsQueue:false
          });

      profile.save(null, {
        success: function(profile){
          tmLocalStorage.setObject('profile:'+profile.id, profile);
          profile = tmLocalStorage.getObject('profile:'+profile.id);
          deferred.resolve(profile);
        },
        error: function(response, err){
          console.error('Parse Error: ', err.code, err.message);
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };

    this.followProfile = function(following, user) {
      following = new Profile(following, {
        ngModel: true,
        resetOpsQueue: false
      });

      var deferred     = $q.defer(),
          follow       = new Follow(),
          followACL    = new Parse.ACL(),
          follower     = user.get('profile'),
          hash         = md5.createHash([
            following.id,
            follower.id
          ].sort().join(''));

      follow.set('follower', follower);
      follow.set('following', following);
      follow.set('profileIdsHash', hash);
      followACL.setPublicReadAccess(true);
      followACL.setWriteAccess(user, true);
      follow.setACL(followACL);

      follow
      .save()
      .then(function () {
        deferred.resolve();
      }, function (err) {
        console.error('Parse Error: ', err.code, err.message);
        deferred.reject(err);
      });
      return deferred.promise;
    };

    this.unfollowProfile = function(profileIds) {
      var deferred = $q.defer(),
          query    = new Parse.Query(Follow),
          hash     = md5.createHash(profileIds.sort().join(''));

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
              success: function () {},
              error: function (response, err) {
                console.error('Parse Error: ', err.code, err.message);
                deferred.reject(err);
              }
            });
          }
        },
        error: function (response, err) {
          console.error('Parse Error: ', err.code, err.message);
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };

    this.checkIfFollowExists = function(profileIds) {
      var deferred = $q.defer(),
          query    = new Parse.Query(Follow),
          hash;

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
          console.error('Parse Error: ', err.code, err.message);
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };

    // Query for all other profiles with the Role of "User".
    this.getNeighbourUserProfiles = function(user) {
      var deferred   = $q.defer(),
          rolesQuery = new Parse.Query(Parse.Role);

      $timeout(function (){
        var cache = tmLocalStorage.getObject('profiles', []);
        deferred.notify(cache);
      }, 0);

      rolesQuery.equalTo('name', 'user');

      rolesQuery
      .find()
      .then(function (response){
        if (response.length > 1)
        {
          // console.log('ERROR: There are duplicate roles');
          deferred.reject({
            message: 'Something went wrong, please contact system admin.'
          });
          return;
        }
        var relation      = response[0].relation('users'),
            relationQuery = relation.query();

        // Just incase at any point a user can have both a business and user account.
        // They will not appear in the list of profiles.
        relationQuery.notEqualTo('users', user);

        relationQuery.include('profile');

        relationQuery
        .find()
        .then(function (response){
          var profiles = [];
          for (var i = 0; i < response.length; i++)
          {
            profiles.push(response[i].get('profile'));
          }
          tmLocalStorage.setObject('profiles', profiles);
          profiles = tmLocalStorage.getObject('profiles', []);
          deferred.resolve(profiles);

        }, function (err){
          console.error('Parse Error: ', err.code, err.message);
          deferred.reject(err);
        });
      }, function (err){
        console.error('Parse Error: ', err.code, err.message);
        deferred.reject(err);
      });

      return deferred.promise;
    };

  });
