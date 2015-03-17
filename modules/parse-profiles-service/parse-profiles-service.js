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
  .factory('Profile', function (Parse) {
    return Parse.Object.extend('Profile');
  })
  .factory('Follow', function (Parse) {
    return Parse.Object.extend('Follow');
  })
  .factory('Connection', function (Parse) {
    return Parse.Object.extend('Connection');
  })
  .provider('tmProfiles', function () {

    var options = {
      profileCacheKey: 'User/Profile',
      profileEditCacheKey: 'User/Profile/Edit',
      profilesCacheKey: 'User/Profiles',
      connectionsCacheKey: 'User/Connections',
      connectionsEditCacheKey: 'User/Connections/Edit'
    };

    this.configure = function (configOptions) {
      angular.extend(options, configOptions);
    };

    this.$get = [
      '$q',
      'Profile',
      'Follow',
      'Parse',
      'tmLocalStorage',
      '$timeout',
      '$log',
      'md5',
      'Connection',
    function ( $q, Profile, Follow, Parse, tmLocalStorage, $timeout, $log, md5, Connection ) {

      function getProfileById(profileId, edit){
        var deferred      = $q.defer(),
          profilesQuery = new Parse.Query(Profile),
          cacheKey      = options.profileCacheKey,
          ngProfile, model, cache;

        if (edit) {
          cacheKey = options.profileEditCacheKey;
        }

        $timeout(function (){
          cache = tmLocalStorage.getObject(cacheKey);
          deferred.notify(cache);
        }, 0);

        profilesQuery.get(profileId, {
          success: function(parseProfile) {
            model = parseProfile.getNgModel();
            if (edit) {
              model = parseProfile.getNgFormModel();
            }
            tmLocalStorage.setObject(cacheKey, model);
            ngProfile = tmLocalStorage.getObject(cacheKey);
            deferred.resolve(ngProfile);
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
            }),
            cacheKey  = options.profileEditCacheKey;

        profile.save(null, {
          success: function(profile){
            tmLocalStorage.setObject(cacheKey, profile.getNgFormModel());
            profile = tmLocalStorage.getObject(cacheKey);
            deferred.resolve(profile);
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
          console.error('Parse Error: ', err);
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        });
        return deferred.promise;
      };

      this.destroyProfileRelation = function(profileIds, classNameSwitch) {
        var classObject;
        switch (classNameSwitch) {
          case 'Follow':
            classObject = Follow;
            break;
          case 'Connection':
            classObject = Connection;
            break;
        }
        var deferred = $q.defer(),
            query    = new Parse.Query(classObject),
            hash     = md5.createHash(profileIds.sort().join(''));

        query.equalTo('profileIdsHash', hash);
        query.find({
          success: function (response) {
            if (!response.length) {
              console.error('No Parse '+classNameSwitch+' object found.');
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
                success: function () {},
                error: function (response, err) {
                  console.error('Parse Error: ', err);
                  deferred.reject({
                    message: 'Please try again in a few moments, or contact support.'
                  });
                }
              });
            }
          },
          error: function (response, err) {
            console.error('Parse Error: ', err);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      this.checkIfFollowExists = function(profileIdsArray) {
        var deferred = $q.defer(),
            query    = new Parse.Query(Follow),
            hash;

        hash = md5.createHash(profileIdsArray.sort().join(''));

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
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      // Creates a two way relation between two Parse Profiles.
      this.connectWithProfile = function(ngReceiverProfile, senderParseUser, sendRequest) {
        var deferred        = $q.defer(),
          senderUserId    = senderParseUser.id,
          senderProfile   = senderParseUser.get('profile'),
          receiverUserId  = ngReceiverProfile.user.objectId,
          receiverProfile = new Profile(),
          connection      = new Connection(),
          ACL             = new Parse.ACL(),
          hash            = md5.createHash([
            senderProfile.id,
            ngReceiverProfile.objectId
          ].sort().join(''));

        receiverProfile.id = ngReceiverProfile.objectId;

        ACL.setReadAccess(senderUserId, true);
        ACL.setWriteAccess(senderUserId, true);
        ACL.setReadAccess(receiverUserId, true);
        ACL.setWriteAccess(receiverUserId, true);
        connection.setACL(ACL);

        connection.set('sender', senderProfile);
        connection.set('receiver', receiverProfile);
        connection.set('profileIdsHash', hash);
        connection.set('requestStatus', 'accepted');
        if (sendRequest) {
          connection.set('requestStatus', 'pending');
        }
        connection.save({
          success: function () {
            deferred.resolve();
          },
          error: function (err) {
            console.error('Parse Error: ', err);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      this.acceptConnectionRequest = function(connectionId) {
        var deferred = $q.defer(),
            query    = new Parse.Query(Connection);

        query
        .get(connectionId)
        .then(function (parseConnection) {
          parseConnection.set('requestStatus', 'accepted');

          parseConnection
          .save()
          .then(function () {

            deferred.resolve();
          },
          fail);
        },
        fail);

        function fail(err){
          console.error('Parse Error: ', err);
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        }

        return deferred.promise;
      };

      this.checkIfConnectionExists = function(profileIdsArray){
        var deferred = $q.defer(),
            query    = new Parse.Query(Connection),
            hash     = md5.createHash(profileIdsArray.sort().join(''));

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
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      function getConnections(user, edit) {
        var deferred = $q.defer(),
            query    = new Parse.Query(Connection),
            cacheKey = options.connectionsCacheKey;

        if (edit) {
          cacheKey = options.connectionsEditCacheKey;
        }

        query.include('receiver');
        query.include('sender');
        query.find({
          success: function (response) {
            var ngArray = [], connections;
            for (var i = 0; i < response.length; i++) {
              if (edit) {
                ngArray.push(response[i].getNgFormModel());
                continue;
              }
              ngArray.push(response[i].getNgModel());
            }
            tmLocalStorage.setObject(cacheKey, ngArray);
            connections = tmLocalStorage.getObject(cacheKey, []);
            deferred.resolve(connections);
          },
          error: function (err) {
            console.error('Parse Error: ', err);
            deferred.reject({
              message: 'Something went wrong, please contact system admin.'
            });
          }
        });
        return deferred.promise;
      }

      this.getConnectionsForDisplay = function (user) {
        return getConnections(user, false);
      };

      this.getConnectionsForEdit = function (user) {
        return getConnections(user, true);
      };

      // Query for all other profiles with the Role of role argument string.
      this.getNeighbouringRoleSpecificProfiles = function(roleKey) {
        var deferred   = $q.defer(),
            user       = Parse.User.current() || {},
            rolesQuery = new Parse.Query(Parse.Role),
            cacheKey   = options.profilesCacheKey,
            cache;

        $timeout(function (){
          cache = tmLocalStorage.getObject(cacheKey, []);
          deferred.notify(cache);
        }, 0);

        rolesQuery.equalTo('name', roleKey);

        rolesQuery
        .find()
        .then(function (response){
          if (response.length > 1)
          {
            console.error('Roles Error: There are duplicate roles in the database.');
            deferred.reject({
              message: 'Something went wrong, please contact system admin.'
            });
            return;
          }
          var relation      = response[0].relation(roleKey+'s'),
              relationQuery = relation.query();

          if (user.id) {
            relationQuery.notEqualTo(roleKey, user);
          }

          relationQuery.include('profile');

          relationQuery
          .find()
          .then(function (response){
            var profiles = [];
            for (var i = 0; i < response.length; i++)
            {
              if (!response[i].get('profile')) {
                continue;
              }
              profiles.push(response[i].get('profile'));
            }
            tmLocalStorage.setObject(cacheKey, profiles);
            profiles = tmLocalStorage.getObject(cacheKey, []);
            deferred.resolve(profiles);

          }, function (err){
            console.error('Parse Error: ', err);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          });
        }, function (err){
          console.error('Parse Error: ', err);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
        });
        return deferred.promise;
      };

      return this;
    }];

    return this;
  });
