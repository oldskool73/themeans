'use strict';
/**
 * @ngdoc service
 * @name tm.console-stopwatch
 * @description
 * # JS performance time logging factory.
 * Factory in the themeans repo.
 */
angular.module('tm.stop-watch', [])
  .factory('tmStopWatch', function ($window) {
    return function (performance) {
      this.startTime    = 0;
      this.stopTime     = 0;
      this.running      = false;
      this.performance  = performance === false ? false : !!$window.performance;

      this.currentTime = function () {
        return this.performance ? $window.performance.now() : new Date().getTime();
      };

      this.start = function () {
        this.startTime  = this.currentTime();
        this.running    = true;
      };

      this.stop = function () {
        this.stopTime = this.currentTime();
        this.running  = false;
      };

      this.getElapsedMilliseconds = function () {
        if (this.running) {
          this.stopTime = this.currentTime();
        }
        return this.stopTime - this.startTime;
      };

      this.getElapsedSeconds = function (formatted) {
        if (formatted) {
          return '[ ' + this.getElapsedMilliseconds() / 1000 + 's ]';
        }
        return this.getElapsedMilliseconds() / 1000;
      };

      this.printElapsed = function (name) {
        var currentName = name || 'Elapsed:';

        $window.console.log(
          currentName,
          '[' + this.getElapsedMilliseconds() + 'ms]',
          '[' + this.getElapsedSeconds() + 's]'
        );
      };
    }
  });
