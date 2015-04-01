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
    return Parse.Object.extend('MessageThread');
  }
]).factory('Message', [
  'Parse',
  function (Parse) {
    return Parse.Object.extend('Message');
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
      this.getThreadsForEditing = function () {
        return getThreads(true);
      };
      this.getThreadsForDisplay = function () {
        return getThreads(false);
      };
      function getThreads(edit) {
        var deferred = $q.defer(), queryThreads = new Parse.Query(MessageThread), cacheKey = options.messageThreadsCacheKey, ngThreads, cachedThreads;
        if (edit) {
          cacheKey = options.messageThreadsEditCacheKey;
        }
        $timeout(function () {
          cachedThreads = tmLocalStorage.getObject(cacheKey, []);
          deferred.notify(cachedThreads);
        }, 0);
        queryThreads.include('profiles');
        queryThreads.find().then(function (parseThreads) {
          // TODO xaun / amay0048: how should this behave?
          function handleNullEntries() {
            parseThreads.forEach(function (parseThread) {
              var index = parseThread.get('profiles').indexOf(null);
              if (index >= 0) {
                $log.warn('User does not have permissions to view sender or recipient profile(s) for MessageThread/' + parseThread.id);
                parseThread.get('profiles').splice(index, 1, { fullName: 'No Name Available' });
                handleNullEntries();
              }
            });
          }
          handleNullEntries();
          ngThreads = getThreadRecipients(parseThreads, edit);
          // cache all threads before marking objects with unread messages status
          tmLocalStorage.setObject(cacheKey, ngThreads);
          // this will get all unread messages by the current user profile
          getMessagesByContainedInArray(false).then(function (parseMessages) {
            // marks ngThread objects with a boolean value determing whether the thread contains
            // any unread messages
            if (parseMessages.length > 0) {
              ngThreads.forEach(function (ngThread) {
                parseMessages.forEach(function (parseMessage) {
                  if (ngThread.objectId === parseMessage.get('thread').id) {
                    ngThread.unreadMessage = true;
                  }
                });
              });
            }
            // sort message by boolean value so unreadMessages appear at the top of the list.
            ngThreads.sort(function (a, b) {
              return a.unreadMessage === b.unreadMessage ? 0 : a.unreadMessage ? -1 : 1;
            });
            deferred.resolve(ngThreads);
          });
        }, function (err) {
          $log.error('Parse Query Error: ' + err.message, err.code);
          if (err.code === 119) {
            return operationForbiddenFail(deferred, 'MessageThread');
          }
          deferred.reject(err);
        });
        return deferred.promise;
      }
      // Adds a recipients key to each ngThread and excludes the currentUser from the array.
      function getThreadRecipients(parseThreads, edit) {
        var currentUserProfile = Parse.User.current().get('profile'), ngThreads = [], members, ngThread;
        ngThreads = parseThreads.map(function (parseThread) {
          if (edit) {
            ngThread = parseThread.getNgFormModel();
          } else {
            ngThread = parseThread.getNgModel();
          }
          ngThread.recipients = [];
          members = ngThread.profiles;
          members.forEach(function (member) {
            if (member.objectId !== currentUserProfile.id) {
              ngThread.recipients.push(member);
            }
          });
          return ngThread;
        });
        return ngThreads;
      }
      this.getMessagesFromThreadForEditing = function (threadId) {
        return getMessagesFromThread(threadId, true);
      };
      this.getMessagesFromThreadForDisplay = function (threadId) {
        return getMessagesFromThread(threadId, false);
      };
      function getMessagesFromThread(threadId, edit) {
        var deferred = $q.defer(), cacheKey = options.messagesCacheKey + '/' + threadId, relation, queryThreadMessages, ngMessages, cache;
        if (edit) {
          cacheKey = options.messagesEditCacheKey + '/' + threadId;
        }
        $timeout(function () {
          cache = tmLocalStorage.getObject(cacheKey);
          deferred.notify(cache);
        }, 0);
        getThreadById(threadId).then(function (thread) {
          relation = thread.relation('messages');
          queryThreadMessages = relation.query();
          queryThreadMessages.ascending('createdAt');
          queryThreadMessages.include('sender');
          queryThreadMessages.include('recipients');
          queryThreadMessages.find({
            success: function (parseMessages) {
              var promises = [];
              // Set message to all messages in this thread to viewed for current user
              ngMessages = parseMessages.map(function (parseMessage) {
                parseMessage.get('recipients').forEach(function (recipient) {
                  if (recipient.profile.id === Parse.User.current().get('profile').id) {
                    recipient.viewed = true;
                  }
                });
                promises.push(parseMessage.save());
                return edit ? parseMessage.getNgFormModel() : parseMessage.getNgModel();
              });
              tmLocalStorage.setObject(cacheKey, ngMessages);
              ngMessages = tmLocalStorage.getObject(cacheKey);
              $q.all(promises).then(function () {
                // @params(result)
                deferred.resolve(ngMessages);
              }, function (err) {
                $log.error('Parse Save Error: ' + err.message, err.code);
              });
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
      this.updateMessageBadge = function (containedInArray) {
        return getMessagesByContainedInArray(true, containedInArray);
      };
      this.getThreadsWithUnreadMessages = function (containedInArray) {
        return getMessagesByContainedInArray(false, containedInArray);
      };
      function getMessagesByContainedInArray(returnCount, containedInArray) {
        var deferred = $q.defer(), queryMessages = new Parse.Query(Message), callBacks;
        if (!containedInArray || !containedInArray.length) {
          containedInArray = [{
              profile: Parse.User.current().get('profile'),
              viewed: false
            }];
        }
        callBacks = {
          success: function (response) {
            deferred.resolve(response);
          },
          error: function (err) {
            $log.error('Parse Query Error: ' + err.message, err.code);
            deferred.resolve();
          }
        };
        queryMessages.containedIn('recipients', containedInArray);
        if (returnCount) {
          queryMessages.count(callBacks);
        } else {
          queryMessages.find(callBacks);
        }
        return deferred.promise;
      }
      this.setMessagesToRead = function (ngThread) {
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
      // send a message to a specific thread
      this.respond = function (threadId, message) {
        var deferred = $q.defer(), receiverObject;
        getThreadById(threadId).then(function (thread) {
          message.sender = Parse.User.current().get('profile');
          message.recipients = getThreadRecipients([thread], true)[0].recipients;
          message.recipients = message.recipients.map(function (receiverPointerObject) {
            return receiverObject = {
              profile: receiverPointerObject,
              viewed: false
            };
          });
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
        var deferred = $q.defer(), userIds = [], threadParticipantProfiles = [], receiverProfile, receiverObject;
        message.recipients = message.recipients.map(function (ngReceiver) {
          receiverProfile = new Profile();
          receiverProfile.id = ngReceiver.objectId;
          userIds.push(ngReceiver.user.objectId);
          threadParticipantProfiles.push(receiverProfile);
          return receiverObject = {
            profile: receiverProfile,
            viewed: false
          };
        });
        userIds.push(Parse.User.current().id);
        threadParticipantProfiles.push(message.sender);
        checkForExistingThread(threadParticipantProfiles).then(function (thread) {
          if (thread) {
            addMessageToThread(thread[0], message).then(function () {
              deferred.resolve();
            }, fail);
          } else {
            createThread(threadParticipantProfiles, userIds).then(function (thread) {
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
      function checkForExistingThread(participants) {
        var deferred = $q.defer(), query = new Parse.Query(MessageThread), profileIds;
        profileIds = participants.map(function (participant) {
          return participant.id;
        });
        query.equalTo('profileIdsHash', hashProfileIds(profileIds));
        query.find({
          success: function (response) {
            if (response.length > 1) {
              return deferred.reject({ message: 'There are duplicate threads. Please contact system admin.' });
            }
            if (!response.length) {
              return deferred.resolve(false);
            }
            deferred.resolve(response);
          },
          error: function (err) {
            deferred.reject(err);
          }
        });
        return deferred.promise;
      }
      function createThread(participantProfiles, userIds) {
        var deferred = $q.defer(), threadACL = new Parse.ACL(), profileIds = [];
        if (participantProfiles.length !== userIds.length) {
          $log.error('Error with message thread participants in createThread(): participantProfiles.length is not equal to userIds to length');
        }
        var messageThread = new MessageThread({ profiles: [] });
        for (var i = 0; i < participantProfiles.length; i++) {
          threadACL.setReadAccess(userIds[i], true);
          threadACL.setWriteAccess(userIds[i], true);
          messageThread.get('profiles').push(participantProfiles[i]);
          profileIds.push(participantProfiles[i].id);
        }
        ;
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
        message.set('sender', message.get('sender'));
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