/**
 * utils-demo - 
 * @version v0.0.0 - 2015-01-05
 * @link 
 * @license 
 */
'use strict';

/**
 * @ngdoc service
 * @name doctaApp.CL
 * @description
 * # CL
 * Service in the doctaApp.
 */
angular.module('tm.consolelog')
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

'use strict';

/**
 * @ngdoc service
 * @name pressChampagneApp.GeoLocation
 * @description
 * # GeoLocation
 * Service in the pressChampagneApp.
 */
angular.module('tm.geolocation')
  .service('tmGeoLocation', function GeoLocation($q, $http) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    this.currentPosition = function(){
        var deferred = $q.defer();

        if (navigator.geolocation)
        {
        	(function(deferred){
    	        navigator
    	          .geolocation
    	            .getCurrentPosition(function(position){
                        deferred
                            .resolve({
                                latitude: position.coords.latitude.toFixed(4),
                                longitude: position.coords.longitude.toFixed(4)
                            });
    	            });
        	})(deferred);
        }
        else
        {
            deferred.reject({
                message:'This platform doesn\'t support geolocation'
            });
        }

        return deferred.promise;
    };

    this.getAddressFromLatLng = function (position) {
      var deferred = $q.defer();
      
      var url = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyB_d9eqLvlGAGf1K4a7zJ6cJgdp9JqOts8&latlng=' +
                position.latitude + ',' +
                position.longitude;

      $http.get(url).then(function (response) {
        var data = response.data;

        if (data.status === 'OK')
        {
          var address_components = data.results[0];
          deferred.resolve(address_components);
        }
        else
        {
          if (data.status === "ZERO_RESULTS")
          {
            deferred.reject("We couldn't find your position. Please enter your address:");
          }
          else
          {
            deferred.reject("Something went wrong, Please try again.");
          }
        }
      }, function (data, status) {
        deferred.reject("Something went wrong, Please try again.");
      });

      return deferred.promise;
    };

    return this;
  });


/**
@fileOverview

@toc

*/

'use strict';

angular.module('tm.utils', [
	'tm.geolocation',
  'tm.consolelog'
]);
