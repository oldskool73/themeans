'use strict';
/**
 * @ngdoc service
 * @name creemWebApp.Message
 * @description
 * # Message
 */
angular.module('tm.parse-messages', [
  'tm.parse',
  'tm.localstorage',
  'angular-md5'
]).factory('MessageThread', [
  'Parse',
  function (Parse) {
    var MessageThread = Parse.Object.extend({ className: 'MessageThread' });
    return MessageThread;
  }
]).factory('Message', [
  'Parse',
  function (Parse) {
    var Message = Parse.Object.extend({
        className: 'Message',
        defaults: { status: 1 }
      });
    return Message;
  }
]).provider('tmMessages', function () {
  var options = {
      messagesCacheKey: 'User/Messages',
      messagesEditCacheKey: 'user/Messages/Edit',
      messageThreadsCacheKey: 'User/Messages/Threads',
      messageThreadsEditCacheKey: 'User/Messages/Threads/Edit',
      messageThreadCacheKey: 'User/Messages/Thread',
      messageThreadEditCacheKey: 'User/Messages/Thread/Edit'
    };
  this.configure = function (configOptions) {
    angular.extend(options, configOptions);
  };
  this.$get = [
    'Parse',
    '$q',
    '$timeout',
    'tmLocalStorage',
    'MessageThread',
    'Message',
    'md5',
    '$log',
    'Profile',
    'tmAccounts',
    function (Parse, $q, $timeout, tmLocalStorage, MessageThread, Message, md5, $log, Profile, tmAccounts) {
      function getThreads(edit) {
        //@params(edit, getCachedUnreadCount)
        var deferred = $q.defer(), query = new Parse.Query(MessageThread), cacheKey = options.messageThreadsCacheKey, ngThreads, cachedThreads;
        if (edit) {
          cacheKey = options.messageThreadsEditCacheKey;
        }
        $timeout(function () {
          cachedThreads = tmLocalStorage.getObject(cacheKey, []);
          deferred.notify(cachedThreads);
        }, 0);
        query.include('profiles');
        query.find({
          success: function (parseThreads) {
            ngThreads = getThreadRecipients(parseThreads, edit);
            tmLocalStorage.setObject(cacheKey, ngThreads);
            ngThreads = tmLocalStorage.getObject(cacheKey, []);
            deferred.resolve(ngThreads);
          },
          error: function (err) {
            $log.error('Parse Query Error: ' + err.message, err.code);
            if (err.code === 119) {
              return operationForbiddenFail(deferred, 'MessageThread');
            }
            deferred.reject(err);
          }
        });
        return deferred.promise;
      }
      this.getThreadsForEditing = function (getCachedUnreadCount) {
        return getThreads(true, getCachedUnreadCount);
      };
      this.getThreadsForDisplay = function (getCachedUnreadCount) {
        return getThreads(false, getCachedUnreadCount);
      };
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
        tmAccounts.getUserRoles(Parse.User.current()).then(function () {
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
      // Adds a recipients key to each ngThread and excludes the currentUser from the array.
      function getThreadRecipients(parseThreads, edit) {
        var currentUserProfile = Parse.User.current().get('profile'), ngThreads = [], members, ngThread;
        for (var i = 0; i < parseThreads.length; i++) {
          if (edit) {
            ngThread = parseThreads[i].getNgFormModel();
          } else {
            ngThread = parseThreads[i].getNgModel();
          }
          ngThread.recipients = [];
          members = ngThread.profiles;
          for (var j = 0; j < members.length; j++) {
            if (members[j].objectId !== currentUserProfile.id) {
              ngThread.recipients.push(members[j]);
            }
          }
          ngThreads.push(ngThread);
        }
        return ngThreads;
      }
      function getMessagesFromThread(threadId, edit) {
        var deferred = $q.defer(), cacheKey = options.messagesCacheKey + '/' + threadId, relation, query, ngMessages, cache;
        if (edit) {
          cacheKey = options.messagesEditCacheKey + '/' + threadId;
        }
        $timeout(function () {
          cache = tmLocalStorage.getObject(cacheKey);
          deferred.notify(cache);
        }, 0);
        getThreadById(threadId).then(function (thread) {
          relation = thread.relation('messages');
          query = relation.query();
          query.ascending('createdAt');
          query.include('sender');
          query.include('receivers');
          query.find({
            success: function (parseMessages) {
              ngMessages = [];
              for (var i = 0; i < parseMessages.length; i++) {
                if (edit) {
                  ngMessages.push(parseMessages[i].getNgFormModel());
                } else {
                  ngMessages.push(parseMessages[i].getNgModel());
                }
              }
              tmLocalStorage.setObject(cacheKey, ngMessages);
              ngMessages = tmLocalStorage.getObject(cacheKey);
              deferred.resolve(ngMessages);
            },
            error: function (err) {
              $log.error('Parse Query Error: ' + err.message, err.code);
              deferred.reject(err);
            }
          });
        }, function (err) {
          deferred.reject(err);
        });
        return deferred.promise;
      }
      this.getMessagesFromThreadForEditing = function (threadId) {
        return getMessagesFromThread(threadId, true);
      };
      this.getMessagesFromThreadForDisplay = function (threadId) {
        return getMessagesFromThread(threadId, false);
      };
      function getThreadById(threadId) {
        var deferred = $q.defer(), query = new Parse.Query(MessageThread);
        query.include('profiles');
        query.get(threadId, {
          success: function (response) {
            deferred.resolve(response);
          },
          error: function (err) {
            $log.error('Parse Query Error: ' + err.message, err.code);
            deferred.reject(err);
          }
        });
        return deferred.promise;
      }
      // send a message to a specific thread
      this.respond = function (threadId, message) {
        var deferred = $q.defer();
        getThreadById(threadId).then(function (thread) {
          message.sender = Parse.User.current().get('profile');
          message.receivers = getThreadRecipients([thread], true)[0].recipients;
          addMessageToThread(thread, message).then(function () {
            //@params(message)
            getMessagesFromThread(thread.id, false).then(function (messages) {
              deferred.resolve(messages);
            }, fail);
          }, fail);
        }, fail);
        function fail(err) {
          $log.error('Parse Error: ' + err.message, err.code);
          deferred.reject(err);
        }
        return deferred.promise;
      };
      // send a message to a profile
      this.send = function (message) {
        var deferred = $q.defer(), tmpReceivers = [], userIds = [];
        // convert ngProfile receivers to parse pointer objects & get user ids for thread ACL.
        for (var i = 0; i < message.receivers.length; i++) {
          // create parse pointer object from receivers ngProfile
          var receiver = new Profile();
          receiver.id = message.receivers[i].objectId;
          // get the user id for thread acl
          userIds.push(message.receivers[i].user.objectId);
          tmpReceivers.push(receiver);
        }
        message.receivers = tmpReceivers;
        // push the sender's (currentUser) user id into the userId array for acls.
        userIds.push(Parse.User.current().id);
        // concat profiles into an array.
        var threadProfiles = message.receivers.concat([message.sender]);
        checkForExistingThread(threadProfiles).then(function (thread) {
          if (thread) {
            addMessageToThread(thread[0], message).then(function () {
              deferred.resolve();
            }, fail);
          } else {
            createThread(threadProfiles, userIds).then(function (thread) {
              addMessageToThread(thread, message).then(function () {
                deferred.resolve();
              }, fail);
            }, fail);
          }
        }, fail);
        function fail(err) {
          $log.error('Parse Error: ' + err.message, err.code);
          deferred.reject(err);
        }
        return deferred.promise;
      };
      function checkForExistingThread(profiles) {
        var deferred = $q.defer(), query = new Parse.Query(MessageThread), profileIds = [];
        for (var i = 0; i < profiles.length; i++) {
          profileIds.push(profiles[i].id);
        }
        query.equalTo('profileIdsHash', hashProfileIds(profileIds));
        query.find({
          success: function (response) {
            if (response.length > 1) {
              deferred.reject({ message: 'There are duplicate threads. Please contact system admin.' });
            }
            if (!response.length) {
              deferred.resolve(false);
            }
            deferred.resolve(response);
          },
          error: function (err) {
            deferred.reject(err);
          }
        });
        return deferred.promise;
      }
      function createThread(threadProfiles, userIds) {
        var deferred = $q.defer(), threadACL = new Parse.ACL(), profileIds = [];
        var messageThread = new MessageThread({ profiles: [] });
        for (var i = 0; i < threadProfiles.length; i++) {
          threadACL.setReadAccess(userIds[i], true);
          threadACL.setWriteAccess(userIds[i], true);
          messageThread.get('profiles').push(threadProfiles[i]);
          profileIds.push(threadProfiles[i].id);
        }
        messageThread.setACL(threadACL);
        messageThread.set('profileIdsHash', hashProfileIds(profileIds));
        messageThread.save({
          success: function (response) {
            deferred.resolve(response);
          },
          error: function (response, err) {
            deferred.reject(err);
          }
        });
        return deferred.promise;
      }
      function hashProfileIds(profileIds) {
        return md5.createHash(profileIds.sort().join(''));
      }
      function addMessageToThread(thread, message) {
        var deferred = $q.defer(), relation = thread.relation('messages');
        message = new Message(message);
        message.set('thread', thread);
        message.save().then(function (message) {
          relation.add(message);
          thread.save().then(function () {
            //@params(response)
            deferred.resolve(message);
          }, fail);
        }, fail);
        function fail(err) {
          deferred.reject(err);
        }
        return deferred.promise;
      }
      return this;
    }
  ];
  return this;
});