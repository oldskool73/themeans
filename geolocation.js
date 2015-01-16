'use strict';
/**
 * @ngdoc service
 * @name pressChampagneApp.GeoLocation
 * @description
 * # GeoLocation
 * Service in the pressChampagneApp.
 */
angular.module('tm.geolocation', []).service('tmGeoLocation', [
  '$q',
  '$http',
  function GeoLocation($q, $http) {
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
          });
        }(deferred));
      } else {
        deferred.reject({ message: 'This platform doesn\'t support geolocation' });
      }
      return deferred.promise;
    };
    this.getAddressFromLatLng = function (position) {
      var deferred = $q.defer();
      var url = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyB_d9eqLvlGAGf1K4a7zJ6cJgdp9JqOts8&latlng=' + position.latitude + ',' + position.longitude;
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
      }, function (data, status) {
        deferred.reject('Something went wrong, Please try again.');
      });
      return deferred.promise;
    };
    return this;
  }
]);