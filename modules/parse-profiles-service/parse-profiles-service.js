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
    'tm.localstorage',
    'tm.parseAccounts'
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
      'md5',
      'Connection',
      'tmAccounts',
      '$log',
    function ( $q, Profile, Follow, Parse, tmLocalStorage, $timeout, md5, Connection, tmAccounts, $log ) {

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
            $log.info('Parse Error: ', err);
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
            $log.info('Parse Error: ', err);
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
          $log.info('Parse Error: ', err);
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        });
        return deferred.promise;
      };

      this.destroyProfileRelation = function(targetProfileId, classNameSwitch) {
        var deferred  = $q.defer(), classObject;
        if (!Parse.User.current()) {
          return deferred.reject({
            message: 'You need to be logged in to connect with a profile.'
          });
        }
        switch (classNameSwitch) {
          case 'Follow':
            classObject = Follow;
            break;
          case 'Connection':
            classObject = Connection;
            break;
        }
        var profileIds  = [ targetProfileId, Parse.User.current().get('profile').id ],
            query       = new Parse.Query(classObject),
            hash        = md5.createHash(profileIds.sort().join(''));

        query.equalTo('profileIdsHash', hash);
        query.find({
          success: function (response) {
            if (!response.length) {
              $log.error('No Parse '+classNameSwitch+' object found.');
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
            function obliterate(parseObject) {
              parseObject.destroy({
                success: function () {},
                error: function (response, err) {
                  $log.info('Parse Error: ', err);
                  deferred.reject({
                    message: 'Please try again in a few moments, or contact support.'
                  });
                }
              });
            }
          },
          error: function (response, err) {
            $log.info('Parse Error: ', err);
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
            $log.info('Parse Error: ', err);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      // Creates a two way relation between two Parse Profiles.
      this.connectWithProfile = function(ngReceiverProfile, roleName) {
        var deferred = $q.defer();

        if (!Parse.User.current()){
          return deferred.reject({
            message: 'You need to be logged in to connect with a Profile'
          });
        }

        var senderUserId  = Parse.User.current().id,
          senderProfile   = Parse.User.current().get('profile'),
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

        if ( tmAccounts.isUserInRole(roleName) ) {
          connection.set('requestStatus', 'pending');
        }
        connection.save({
          success: function (parseConnection) {
            deferred.resolve(parseConnection.getNgModel());
          },
          error: function (err) {
            $log.info('Parse Error: ', err);
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

        if (!Parse.User.current() || !tmAccounts.isUserInRole('user')) {
          return deferred.reject({
            message: 'You are not permitted to perform this action.'
          });
        }

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
          $log.info('Parse Error: ', err);
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        }

        return deferred.promise;
      };

      this.checkIfConnectionExists = function(targetProfileId){
        var deferred = $q.defer();

        if (!Parse.User.current()) {
          return deferred.resolve({
            noCurrentUser: true
          });
        }
        var query       = new Parse.Query(Connection),
            profileIds  = [ targetProfileId, Parse.User.current().get('profile').id ],
            hash        = md5.createHash(profileIds.sort().join(''));

        query.equalTo('profileIdsHash', hash);
        query.find({
          success: function (response) {
            if (!response.length) {
              return deferred.resolve('none');
            }
            else if (response[0] && response[0].get('requestStatus') === 'pending') {
              return deferred.resolve('pending');
            }
            else if (response[0] && response[0].get('requestStatus') === 'accepted') {
              return deferred.resolve('accepted');
            } else {
              $log.info('Parse Error', response);
              deferred.reject({
                message: 'Please try again in a few moments, or contact support.'
              });
            }
          },
          error: function (err) {
            $log.info('Parse Error: ', err);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          }
        });
        return deferred.promise;
      };

      function getConnections(edit) {
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
            var connections = [], ngResponse = {};

            for (var i = 0; i < response.length; i++) {

              if (edit) {
                connections.push(response[i].getNgFormModel());
                continue;
              }
              ngResponse            = response[i].getNgModel();
              ngResponse.connection = ngResponse.sender;

              if (ngResponse.sender.user.objectId === Parse.User.current().id) {
                ngResponse.connection               = ngResponse.receiver;
              }
              // removing excess objects & data.
              delete ngResponse.receiver;
              delete ngResponse.sender;
              if (ngResponse.requestStatus === 'pending') {
                // Prevents the ability to scope hack the stateParams id for a pending candidate.
                delete ngResponse.connection.objectId;
              }

              connections.push(ngResponse);
            }

            tmLocalStorage.setObject(cacheKey, connections);
            connections = tmLocalStorage.getObject(cacheKey, []);
            deferred.resolve(connections);
          },
          error: function (err) {
            $log.info('Parse Error: ', err);
            deferred.reject({
              message: 'Something went wrong, please contact system admin.'
            });
          }
        });
        return deferred.promise;
      }

      this.getConnectionsForDisplay = function () {
        return getConnections(false);
      };

      this.getConnectionsForEdit = function () {
        return getConnections(true);
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
            $log.error('Roles Error: There are duplicate roles in the database.');
            deferred.reject({
              message: 'Something went wrong, please contact system admin.'
            });
            return;
          }
          
          var relation      = response[0].relation('users'),
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
            $log.info('Parse Error: ', err);
            deferred.reject({
              message: 'Please try again in a few moments, or contact support.'
            });
          });
        }, function (err){
          $log.info('Parse Error: ', err);
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
