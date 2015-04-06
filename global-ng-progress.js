'use strict';
/**
 * @ngdoc service
 * @name creemWebApp.ngProgressInterceptor
 * @description
 * # ngProgressInterceptor
 * Factory in the creemWebApp.
 */
angular.module('tm.global-ng-progress', ['ngProgress']).config([
  '$httpProvider',
  function ($httpProvider) {
    $httpProvider.interceptors.push('globalNgProgress');
  }
]).factory('globalNgProgress', function ($log, $q, $injector, $timeout) {
  var ngProgress;
  var reqsTotal = 0, reqsCompleted = 0, latencyThreshold = 100;
  function setComplete() {
    ngProgress.complete();
    reqsCompleted = 0;
    reqsTotal = 0;
  }
  return {
    request: function (config) {
      if (config.ignoreLoadingBar) {
        return config;
      }
      // Inject ngProgress service locally to prevent circular dependancy with $httpProvider.
      if (!ngProgress) {
        ngProgress = $injector.get('ngProgress');
      }
      if (config.url.substring(0, 4) === 'http') {
        if (reqsTotal === 0) {
          ngProgress.reset();
          ngProgress.start();
        }
        reqsTotal++;  // $log.info('reqsTotal = ', reqsTotal);
      }
      return config;
    },
    response: function (response) {
      if (!response || !response.config) {
        $log.error('Broken interceptor detected: Config object not supplied in response.');
        return response;
      }
      if (response.config.ignoreLoadingBar) {
        return response;
      }
      // The view.html request are also http requests. This conditional
      // should only catch requests that are external. Requests to your own
      // server should be ignored.
      if (response.config.url.substring(0, 4) === 'http') {
        $timeout(function () {
          reqsCompleted++;
          // $log.info('reqsCompleted = ', reqsCompleted);
          if (reqsCompleted >= reqsTotal) {
            if (reqsCompleted > reqsTotal) {
              $log.warn('reqsCompleted > reqsTotal');
            }
            setComplete();
          } else {
            var percentage = reqsCompleted / reqsTotal * 100;
            // $log.info(percentage);
            ngProgress.set(percentage);
          }
        }, latencyThreshold);
      }
      return response;
    },
    responseError: function (rejection) {
      if (!rejection || !rejection.config) {
        $log.error('Broken interceptor detected: Config object not supplied in rejection');
        return $q.reject(rejection);
      }
      if (rejection.config.ignoreLoadingBar) {
        return $q.reject(rejection);
      }
      if (rejection.config.url.substring(0, 4) === 'http') {
        $timeout(function () {
          reqsCompleted++;
          if (reqsCompleted >= reqsTotal) {
            setComplete();
          } else {
            var percentage = reqsCompleted / reqsTotal * 100;
            // $log.info(percentage);
            ngProgress.set(percentage);
          }
        }, latencyThreshold);
      }
      return $q.reject(rejection);
    }
  };
});