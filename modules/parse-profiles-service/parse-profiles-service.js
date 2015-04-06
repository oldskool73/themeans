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
.run(function ($rootScope, tmProfiles){
  tmProfiles.setRootScope($rootScope);
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

    var $rootScope;
    // rootScope for broadcasting results
    this.setRootScope  = function(rootScopeRef){
      $rootScope = rootScopeRef;
    };

    this.getProfileByIdForEditing = function(profileId){
      return getProfileById(profileId, true);
    };

    this.getProfileByIdForDisplay = function(profileId){
      return getProfileById(profileId, false);
    };

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
          $log.error('Parse Query Error: ' + err.message, err.code);
          // parse operation forbidden
          if (err.code === 119) {

            return operationForbiddenFail(deferred, 'Profile');
          }
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        }
      });
      return deferred.promise;
    }

    this.getProfiles = function () {
      return getProfiles(arguments);
    };

    this.getNeighbouringProfiles = function (){
      return getProfiles(true, arguments);
    };

    function getProfiles(excludingSelf) {
      var deferred      = $q.defer(),
          profilesQuery = new Parse.Query(Profile),
          cacheKey      = options.profilesCacheKey,
          profiles      = [],
          cache;

      $timeout(function () {
        cache = tmLocalStorage.getObject(cacheKey, []);
        deferred.notify(cache);
      },0);

      var queryIncludeOptions = arguments[1] ? arguments[1] : [];
      for (var i = 0; i < queryIncludeOptions.length; i++) {

        profilesQuery.include(queryIncludeOptions[i]);
      }

      profilesQuery.limit(1000);
      profilesQuery.ascending('businessName');
      
      profilesQuery.find({
        success: function (response) {
          if (excludingSelf) {
            for (var i = 0; i < response.length; i++) {

              if (!response[i].get('user')) {
                $log.warn('Profiles are being created without Parse Users, or something is wrong with profile \'user\' pointers.');
                continue;
              }
              if (response[i].get('user').id === Parse.User.current().id) {
                continue;
              }
              profiles.push(response[i]);
            }
          }
          else {
            profiles = response;
          }

          tmLocalStorage.setObject(cacheKey, Parse.serialiseArrayForDisplay(profiles));
          profiles = tmLocalStorage.getObject(cacheKey, []);
          deferred.resolve(profiles);
        },
        error: function (err) {
          $log.error('Parse Error: ' + err.message, err.code);
          // parse operation forbidden
          if (err.code === 119) {

            return operationForbiddenFail(deferred, 'Profile');
          }
          deferred.reject({
            message: 'Please try again in a few moments, or contact support.'
          });
        }
      });
      return deferred.promise;
    }


    // _User not allowed to perform this operation due to access forbidden..
    // _User account does not exist, or there is a major bug with acls, or route/state auth is
    // letting a _User access something they shouldn't be able to.
    function operationForbiddenFail(deferred, parseClassName) {
      parseClassName = parseClassName ? ' on a ' + parseClassName : '';
      // A non signed in user has queried something they are not allowed to.
      if (!Parse.User.current()) {
        return deferred.reject({
          title: 'Authorisation error: ',
          message: 'You cannot perform this operation' + parseClassName
        });
      }
      // tmAccounts.getUserRoles authenticates _User and their _Roles.
      tmAccounts
      .getUserRoles(Parse.User.current())
      .then(function () {
        // _User is authenticated, but has managed to query something they are not permitted to.
        return deferred.reject({
          title: 'Authorisation error: ',
          message: 'You cannot perform this operation' + parseClassName
        });
      }, function () {
        // _User either does not exist, or has incorrect role permissions.
        tmLocalStorage.clear();
        Parse.User.logOut();
        return deferred.reject({
          title: 'Your account is missing or something is wrong with authorisation.',
          message: 'Please try logging in again or contacting support'
        });
      });
    }

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
          $log.error('Parse Save Error: ' + err.message, err.code);
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
        $log.error('Parse Save Error: ' + err.message, err.code);
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
                $log.error('Parse Destroy Error: ' + err.message, err.code);
                deferred.reject({
                  message: 'Please try again in a few moments, or contact support.'
                });
              }
            });
          }
        },
        error: function (response, err) {
          $log.error('Parse Query Error: ' + err.message, err.code);
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
          $log.error('Parse Query Error: ' + err.message, err.code);
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

      var senderUserId    = Parse.User.current().id,
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
          $log.error('Parse Query Error: ' + err.message, err.code);
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
        .then(function (response) {
          var ngConnection = response.getNgModel();
          deferred.resolve(ngConnection);
        },
        fail);
      },
      fail);

      function fail(err){
        $log.error('Parse Error: ' + err.message, err.code);
        deferred.reject({
          message: 'Please try again in a few moments, or contact support.'
        });
      }

      return deferred.promise;
    };

    this.checkIfConnectionExists = function(targetProfileId){
      var deferred = $q.defer();

      if (!Parse.User.current()) {
        $timeout(function(){
          deferred.resolve({
            noCurrentUser: true
          });
        },0);
        return deferred.promise;
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
          $log.error('Parse Query Error: ' + err.message, err.code);
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
      query.descending('updatedAt');
      query.find({
        success: function (parseConnections) {
          var ngConnections = [], ngConnection;

          if (edit) {
            ngConnections = parseConnections.map(function (parseConnection) {

              return parseConnection.getNgFormModel();
            });

            tmLocalStorage.setObject(cacheKey, ngConnections);

            return deferred.resolve(ngConnections);
          }

          // The following code is designed to simplify displaying a connection.
          ngConnections = parseConnections.map(function (parseConnection) {

            ngConnection = parseConnection.getNgModel();

            if (ngConnection.sender.user.objectId === Parse.User.current().id) {

              ngConnection.connection = ngConnection.receiver;
            }
            else {
              ngConnection.connection = ngConnection.sender;
            }
            // removing excess objects & data.
            delete ngConnection.receiver;
            delete ngConnection.sender;
            if (ngConnection.requestStatus === 'pending') {
              // Prevents the ability to scope hack the stateParams id for a pending candidate.
              delete ngConnection.connection.objectId;
            }
            return ngConnection;
          });

          var pendingConnections  = [],
              acceptedConnections = [];

          ngConnections.forEach(function (ngConnection) {
            if (ngConnection.requestStatus === 'pending') {

              return pendingConnections.push(ngConnection);
            }
            return acceptedConnections.push(ngConnection);
          });

          if ($rootScope && $rootScope.GLOBALS && $rootScope.GLOBALS.events && $rootScope.GLOBALS.events.updateConnectionsBadge)
          {
            $rootScope.$broadcast($rootScope.GLOBALS.events.updateConnectionsBadge, {
              pendingCount: pendingConnections.length
            });
          }

          tmLocalStorage.setObject(cacheKey, ngConnections);

          return deferred.resolve({
            acceptedConnections: acceptedConnections,
            pendingConnections: pendingConnections
          });
        },
        error: function (err) {
          $log.error('Parse Query Error: ' + err.message, err.code);
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


    return this;
  }];

  return this;
});
