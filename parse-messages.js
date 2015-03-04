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
]).service('tmMessages', [
  'Parse',
  '$q',
  '$timeout',
  'tmLocalStorage',
  'MessageThread',
  'Message',
  'md5',
  function (Parse, $q, $timeout, tmLocalStorage, MessageThread, Message, md5) {
    // this.setMessagesStatusCount = function (){
    //   var threadCounts      = [],
    //       totalCount        = 0;
    //   getThreads(true, false)
    //   .then(function (threads) {
    //     for (var i = 0; i < threads.length; i++) {
    //       var parseThread = new MessageThread(threads[i], {
    //             ngModel: true,
    //             resetOpsQueue: false
    //           }),
    //           relation    = parseThread.relation('messages'),
    //           query       = relation.query();
    //       query.equalTo('status', 1);
    //       query
    //       .count()
    //       .then((function (i, parseThread) {
    //         return function (count) {
    //           // Pushes the count of unread messages for this thread.
    //           threadCounts.push(count);
    //           // Sets the count for this thread to cache.
    //           tmLocalStorage.set('thread:unread:count:'+parseThread.id, count);
    //           if (threadCounts.length === parseThread.length) {
    //             for (var j = 0; j < threadCounts.length; j++) {
    //               // sums up all the threadCounts and caches the total.
    //               totalCount += threadCounts[j];
    //             }
    //             tmLocalStorage.set('unread:count:'+Parse.User.current().id, totalCount);
    //           }
    //         };
    //       })(i, parseThread), function (err) {
    //         console.log('ERROR: ', err.code, err.message);
    //       });
    //     }
    //   }, function (err) {
    //     console.log('ERROR: ', err.code, err.message);
    //   });
    // };
    // this.clearUnreadFromThread = function(thread){
    //   var parseThread = new MessageThread(thread),
    //       relation    = parseThread.relation('messages'),
    //       query       = relation.query();
    //   query.equalTo('status', 1);
    //   query
    //   .find()
    //   .then(function (messages) {
    //     for (var i = 0; i < messages.length; i++) {
    //       messages[i].set('status', 0);
    //       messages[i].save();
    //     }
    //     _self.setMessagesStatusCount();
    //   }, function (err) {
    //     console.log('ERR: ', err.code, err.message);
    //   });
    // };
    function getThreads(edit, getCachedUnreadCount) {
      var deferred = $q.defer(), query = new Parse.Query(MessageThread), cacheKey = 'message:threads:display', ngThreads, cachedCount, cachedThreads;
      if (edit) {
        cacheKey = 'message:threads:edit';
      }
      $timeout(function () {
        cachedThreads = tmLocalStorage.getObject(cacheKey);
        deferred.notify(cachedThreads);
      }, 0);
      query.include('users');
      query.include('users.profile');
      query.find({
        success: function (parseThreads) {
          ngThreads = getThreadRecipients(parseThreads, edit);
          if (getCachedUnreadCount) {
            for (var i = 0; i < ngThreads.length; i++) {
              cachedCount = tmLocalStorage.get(':thread:unread:count:' + ngThreads[i].objectId, 0);
              ngThreads[i].unreadCount = cachedCount;
            }
          }
          tmLocalStorage.setObject('message:threads', ngThreads);
          ngThreads = tmLocalStorage.getObject('message:threads');
          deferred.resolve(ngThreads);
        },
        error: function (err) {
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
    // Adds a recipients key to each ngThread and excludes the currentUser from the array.
    function getThreadRecipients(parseThreads, edit) {
      var currentUser = Parse.User.current(), ngThreads = [], members, ngThread;
      for (var i = 0; i < parseThreads.length; i++) {
        if (edit) {
          ngThread = parseThreads[i].getNgFormModel();
        } else {
          ngThread = parseThreads[i].getNgModel();
        }
        ngThread.recipients = [];
        members = ngThread.users;
        for (var j = 0; j < members.length; j++) {
          if (members[j].objectId !== currentUser.id) {
            ngThread.recipients.push(members[j]);
          }
        }
        ngThreads.push(ngThread);
      }
      return ngThreads;
    }
    function getMessagesFromThread(threadId, edit) {
      var deferred = $q.defer(), cacheKey = 'thread:messages:display:' + threadId, relation, query, ngMessages, cache;
      if (edit) {
        cacheKey = 'thread:messages:edit:' + threadId;
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
        query.include('sender.profile');
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
      query.include('users');
      query.include('users.profile');
      query.get(threadId, {
        success: function (response) {
          deferred.resolve(response);
        },
        error: function (err) {
          deferred.reject(err);
        }
      });
      return deferred.promise;
    }
    // send a message to a specific thread
    this.respond = function (threadId, message) {
      var deferred = $q.defer();
      getThreadById(threadId).then(function (thread) {
        message.sender = Parse.User.current();
        message.receivers = getThreadRecipients([thread], true)[0].recipients;
        addMessageToThread(thread, message).then(function () {
          //@params(message)
          getMessagesFromThread(thread.id, false).then(function (messages) {
            deferred.resolve(messages);
          }, fail);
        }, fail);
      }, fail);
      function fail(err) {
        deferred.reject(err);
      }
      return deferred.promise;
    };
    // send a message to a profile
    this.send = function (message) {
      var deferred = $q.defer(), threadUsers = [
          message.sender,
          message.receivers
        ];
      // flatten the array.
      threadUsers = threadUsers.concat.apply([], threadUsers);
      checkForExistingThread(threadUsers).then(function (thread) {
        if (thread) {
          addMessageToThread(thread[0], message).then(function () {
            deferred.resolve();
          }, fail);
        } else {
          createThread(threadUsers).then(function (thread) {
            addMessageToThread(thread, message).then(function () {
              deferred.resolve();
            }, fail);
          }, fail);
        }
      }, fail);
      function fail(err) {
        // console.log('Messages Service ERROR: ', err.code, err.message);
        deferred.reject(err);
      }
      return deferred.promise;
    };
    function checkForExistingThread(users) {
      var deferred = $q.defer(), query = new Parse.Query(MessageThread);
      var userIds = [];
      for (var i = 0; i < users.length; i++) {
        userIds.push(users[i].id);
      }
      query.equalTo('userIdsHash', hashUserIds(userIds));
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
    function createThread(threadUsers) {
      var deferred = $q.defer(), threadACL = new Parse.ACL(), userIds = [];
      var messageThread = new MessageThread({ users: [] });
      for (var i = 0; i < threadUsers.length; i++) {
        threadACL.setReadAccess(threadUsers[i].id, true);
        threadACL.setWriteAccess(threadUsers[i].id, true);
        messageThread.get('users').push(threadUsers[i]);
        userIds.push(threadUsers[i].id);
      }
      messageThread.setACL(threadACL);
      messageThread.set('userIdsHash', hashUserIds(userIds));
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
    function hashUserIds(userIds) {
      return md5.createHash(userIds.sort().join(''));
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
      function fail(response, err) {
        deferred.reject(err);
      }
      return deferred.promise;
    }
  }
]);