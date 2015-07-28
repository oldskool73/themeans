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
  .service('FireLocation', function FireLocation(Firebase, FBRoot, $window, $timeout, $interval, $rootScope, tmGeoLocation) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var serverTimeOffset;

    var base = FBRoot,
        geoFireEndpoint = new $window.GeoFire(base);

    // Just testing for now
    $interval(function(){
      geoFireEndpoint
      .set('xxxyyyzzz', [ 37.32479044, -122.02507262 + Math.random()/100 ]);
    }, 4000);

    // Maybe set to last known location??
    var geoQuery;

    function configureGeoQuery( lat, lng ) {
      
      geoQuery = geoFireEndpoint.query({
          center: [ lat, lng ],
          radius: 3000
      });

      // Will need a service that checks the key against keys in your group
      geoQuery.on('key_entered', 
        function onKeyEnteredRegistration(key, location) {

          $rootScope.$broadcast('geofire-key-entered', key, location);
        });
      
      // Will need a service that checks the key against keys in your group
      geoQuery.on('key_moved', 
        function onKeyEnteredRegistration(key, location) {

          $rootScope.$broadcast('geofire-key-moved', key, location);
        });

      geoQuery.on('ready', 
        function onReadyRegistration() {

          $rootScope.$broadcast('geofire-ready');
        });
    }

    $rootScope.$on('gps-position-update', 
      function gpsPositionOnUpdate(evt, location){

        var lat = location.geoposition.coords.latitude,
          lng = location.geoposition.coords.longitude;

        if(geoQuery)
        {
          geoQuery.updateCriteria({
            center: [ lat, lng ],
            radius: 3000
          });
        }
        else
        {
          configureGeoQuery( lat, lng );
        }

        // This should be your UUID for firebase
        geoFireEndpoint
        .set('boodle', [ lat, lng ]);

      });

    (function(ref) {
      serverTimeOffset = 0;
      ref.child('.info/serverTimeOffset').on('value', function(snap) {
        serverTimeOffset = snap.val();
      });
    })(base);

    this.getCurrentServerTime = function(){
      return Date.now() + serverTimeOffset;
    };

    return this;
  });