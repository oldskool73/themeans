'use strict';

/**
 * @ngdoc service
 * @name doctaApp.CL
 * @description
 * # CL
 * Service in the doctaApp.
 */
angular.module('tm.consolelog',[])
  .service('CL', function CL($log) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    this.log = function () {
      var handle, message, i,
          args = [];

      for (i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }

      handle = args.shift();
      message = args.shift();

      $log.log(handle, message, args);

      return true;
    };
  });
