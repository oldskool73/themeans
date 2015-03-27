'use strict';

/**
 * @ngdoc service
 * @name mustardApp.FireConfig
 * @description
 * # FireConfig
 * Service in the mustardApp.
 */
angular.module('tm.fire-location',[
    'firebase'
  ])
  .service('FireConfig', function FireConfig(Firebase, $window, $timeout, $interval, Parse, $rootScope) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var serverTimeOffset;

    var base = new Firebase('https://creem.firebaseio.com/'),
        // geopositionRef = new Firebase('https://creem.firebaseio.com/location'),
        geoFireEndpoint = new $window.GeoFire(base);

    $rootScope.$on('gps-position-update',function(evt, location){
      geoFireEndpoint
      .set(Parse.User.current().id, [
        location.geoposition.coords.latitude,
        location.geoposition.coords.longitude
      ]);
    });
    // debugger;
    var geoQuery = geoFireEndpoint.query({
        center: [-33.8685763,151.2097666],
        radius: 3000
    });

    var onKeyEnteredRegistration = geoQuery.on('key_entered', function(key, location) {
      $rootScope.$broadcast('geofire-key-entered',key, location);
    });

    var onKeyEnteredRegistration = geoQuery.on('key_moved', function(key, location) {
      $rootScope.$broadcast('geofire-key-moved',key, location);
    });

    var onReadyRegistration = geoQuery.on('ready', function() {
      $rootScope.$broadcast('geofire-ready');
    });

    $interval(function(){
      geoFireEndpoint
      .set('xxxyyyzzz', [-33.8685763,151.2097666 + Math.random()/100]);
    },4000);

    (function(ref) {
      serverTimeOffset = 0;
      ref.child('.info/serverTimeOffset').on('value', function(snap) {
        serverTimeOffset = snap.val();
      });
    })(base);

    this.updateLocation = function(){

    };

    this.getCurrentServerTime = function(){
        return Date.now() + serverTimeOffset;
    };

    return this;
  });