'use strict';
/**
 * @ngdoc service
 * @name pressChampagneApp.GeoLocation
 * @description
 * # GeoLocation
 * Service in the pressChampagneApp.
 */
angular.module('tm.geolocation', []).provider('tmGeoLocation', function () {
  // private object
  var options = { key: '' };
  // Public API for configuration
  this.configure = function (configOptions) {
    // merges objects together
    angular.extend(options, configOptions);
  };
  // Method for instantiating
  this.$get = [
    '$q',
    '$http',
    '$rootScope',
    '$log',
    function GeoLocation($q, $http, $rootScope, $log) {
      var gps = {}, self = this;
      // AngularJS will instantiate a singleton by calling "new" on this function
      this.currentPosition = function () {
        var deferred = $q.defer();
        if (navigator.geolocation) {
          (function (deferred) {
            navigator.geolocation.getCurrentPosition(function (position) {
              deferred.resolve({
                latitude: position.coords.latitude.toFixed(4),
                longitude: position.coords.longitude.toFixed(4)
              });
            }, function (err) {
              // This error callback handles user deny permission to access location.
              deferred.reject({
                message: err.message,
                response: err
              });
            });
          }(deferred));
        } else {
          deferred.reject({ message: 'This platform doesn\'t support geolocation' });
        }
        return deferred.promise;
      };
      this.getAddressFromLatLng = function (position) {
        var deferred = $q.defer();
        var url = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + options.key + '&latlng=' + position.latitude + ',' + position.longitude;
        $http.get(url).then(function (response) {
          var data = response.data;
          if (data.status === 'OK' || data.statusText === 'OK') {
            var address_components = data.results[0];
            deferred.resolve(address_components);
          } else {
            if (data.status === 'ZERO_RESULTS') {
              deferred.reject({
                message: 'We couldn\'t find your position. Please enter your address:',
                response: data
              });
            } else if (data.status === 'OVER_QUERY_LIMIT') {
              deferred.reject({
                message: 'Something went wrong, Please try again later.',
                response: data
              });
            } else {
              deferred.reject({
                message: 'Something went wrong, Please try again later.',
                response: data
              });
            }
          }
        }, function () {
          // @params (data, status)
          deferred.reject('Something went wrong, Please try again.');
        });
        return deferred.promise;
      };
      this.getAddressFromString = function (string) {
        var deferred = $q.defer();
        var url = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + options.key + '&address=' + string;
        $http.get(url).then(function (response) {
          var data = response.data;
          if (data.status === 'OK' || data.statusText === 'OK') {
            var address_components = data.results[0];
            deferred.resolve(address_components);
          } else {
            if (data.status === 'ZERO_RESULTS') {
              deferred.reject({
                message: 'We couldn\'t find your position. Please enter your address:',
                response: data
              });
            } else if (data.status === 'OVER_QUERY_LIMIT') {
              deferred.reject({
                message: 'Something went wrong, Please try again later.',
                response: data
              });
            } else {
              deferred.reject({
                message: 'Something went wrong, Please try again later.',
                response: data
              });
            }
          }
        }, function () {
          // @params (data, status)
          deferred.reject('Something went wrong, Please try again.');
        });
        return deferred.promise;
      };
      this.startWatching = function (gpsOptions) {
        var deferred = $q.defer();
        if (navigator.geolocation) {
          if (!gpsOptions) {
            // This needs enough time to return a geopos 
            // or it will return an empty object. 
            gpsOptions = {
              enableHighAccuracy: true,
              timeout: 20 * 1000,
              maximumAge: 20 * 1000
            };
          }
          self.stopWatching();
          gps.GPSWatchId = navigator.geolocation.watchPosition(function onSuccess(pos) {
            // $log.info('gps-position-update',pos);
            $rootScope.$broadcast('gps-position-update', { geoposition: pos });
          }, function onError(err) {
            $log.error(err);
          }, gpsOptions);
          deferred.resolve({
            message: 'Started watching position',
            gpsId: gps.GPSWatchId
          });
        } else {
          deferred.reject({ message: 'This platform doesn\'t support geolocation' });
        }
        return deferred.promise;
      };
      this.stopWatching = function () {
        if (gps.GPSWatchId) {
          return navigator.geolocation.clearWatch(gps.GPSWatchId);
        }
        return true;
      };
      return this;
    }
  ];
});