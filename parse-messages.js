'use strict';
/**
 * @ngdoc service
 * @name tm.messages
 * @description
 * # Messages
 * Service in the tm.messages module
 ** Sends messages to parse users.
    *** Requires angular.factories for Parse.Object MessageThread and Message definitions ***
 */
angular.module('tm.parse-messages', [
  'tm.ionic-parse',
  'tm.localstorage'
]).service('tmMessages', [
  'Parse',
  '$q',
  '$timeout',
  'tmLocalStorage',
  'MessageThread',
  'Message',
  function (Parse, $q, $timeout, tmLocalStorage, MessageThread, Message) {
    var _self = this;
    this.getThreads = function () {
      var deferred = $q.defer(), query = new Parse.Query(MessageThread);
      $timeout(function () {
        var cache = tmLocalStorage.getObject('message-threads');
        deferred.notify(cache);
      }, 0);
      query.include('users');
      query.include('users.profile');
      query.find({
        success: function (parseThreads) {
          var ngThreads = getThreadRecipients(parseThreads);
          tmLocalStorage.setObject('message-threads', ngThreads);
          ngThreads = tmLocalStorage.getObject('message-threads');
          deferred.resolve(ngThreads);
        },
        error: function (err) {
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };
    // Adds a recipients key to each ngThread and excludes the currentUser from the array.
    function getThreadRecipients(parseThreads, toggle) {
      var currentUser = Parse.User.current(), ngThreads = [], members, ngThread;
      for (var i = 0; i < parseThreads.length; i++) {
        // keeps parse serials
        if (toggle) {
          ngThread = parseThreads[i].getNgFormModel();
        }  // deep copy for display
        else {
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
    this.getMessagesFromThread = function (threadId) {
      var deferred = $q.defer();
      $timeout(function () {
        var cache = tmLocalStorage.getObject('thread-' + threadId + '-messages');
        deferred.notify(cache);
      }, 0);
      getThreadById(threadId).then(function (thread) {
        var relation = thread.relation('messages');
        var query = relation.query();
        query.ascending('createdAt');
        query.include('sender');
        query.include('sender.profile');
        query.include('receivers');
        query.find({
          success: function (response) {
            var ngMessages = [], messages;
            for (var i = 0; i < response.length; i++) {
              ngMessages.push(response[i].getNgModel());
            }
            tmLocalStorage.setObject('thread-' + threadId + '-messages', ngMessages);
            messages = tmLocalStorage.getObject('thread-' + threadId + '-messages');
            deferred.resolve(messages);
          },
          error: function (err) {
            deferred.reject(err);
          }
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
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
          _self.getMessagesFromThread(thread.id).then(function (messages) {
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
      // xaun: containsAll query is not strict enough. Aslong as all users passed in are
      //       apart of the thread, it will return true.
      query.containsAll('users', users);
      query.find({
        success: function (response) {
          if (response.length > 1) {
            // xaun: leaving handling this scenario out for now.
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
      var deferred = $q.defer(), messageThread = null, threadACL = new Parse.ACL();
      // TODO: this shoudln't be necessary, sometimes there
      // are other users when a new thread is instantiated
      messageThread = new MessageThread({ users: [] });
      for (var i = 0; i < threadUsers.length; i++) {
        threadACL.setReadAccess(threadUsers[i].id, true);
        threadACL.setWriteAccess(threadUsers[i].id, true);
        messageThread.get('users').push(threadUsers[i]);
      }
      messageThread.setACL(threadACL);
      messageThread.save({
        success: function (response) {
          deferred.resolve(response);
        },
        error: function (err) {
          deferred.reject(err);
        }
      });
      return deferred.promise;
    }
    function addMessageToThread(thread, message) {
      var deferred = $q.defer(), relation = thread.relation('messages');
      message = new Message(message);
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
  }
]);