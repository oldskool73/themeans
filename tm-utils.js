/**
 * utils-demo - 
 * @version v0.0.1 - 2015-01-05
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

'use strict';

/**
 * @ngdoc service
 * @name pressChampagneApp.GeoLocation
 * @description
 * # GeoLocation
 * Service in the pressChampagneApp.
 */
angular.module('tm.geolocation',[])
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


'use strict';

/**
 * @ngdoc service
 * @name airplayPutioApp.localstorage
 * @description
 * # localstorage
 * Service in the airplayPutioApp.
 */
angular.module('tm.ionic-parse',['ionic'])
  .service('Parse', function Parse($q, $window, $ionicPlatform) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var deferred = $q.defer(),
        self = this;

    // override this function using a provider in the application config
    this.getKeys = function(){
      return {
        applicationId: '',
        javaScriptKey: '',
        clientKey: ''
      }
    };

    var parse = $window.Parse;
    // Delete from the $window scope to ensure that we use the deps injection
    delete $window.Parse; 

    parse.initialize(
      self.getKeys().applicationId,
      self.getKeys().javaScriptKey
    );

    $ionicPlatform.ready(function(){
      if($window.parsePlugin)
      {
        var bridge = $window.parsePlugin;
        // Delete from the $window scope to ensure that we use the deps injection
        delete $window.parsePlugin;
        bridge.initialize(self.getKeys().applicationId, self.getKeys().clientKey, function()
        {
          deferred.resolve(bridge);
        },function()
        {
          deferred.reject(bridge);
        });
      }
    });

    parse.nativeBridge = deferred.promise;
    
    return parse;
  });
'use strict';

/**
 * @ngdoc service
 * @name airplayPutioApp.localstorage
 * @description
 * # localstorage
 * Service in the airplayPutioApp.
 */
angular.module('tm.localstorage',[])
  .service('tmLocalStorage', function tmLocalStorage($window) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    return {
      set: function(key, value) {
        $window.localStorage[key] = value;
      },
      get: function(key, defaultValue) {
        var ret;
        try
        {
          ret = angular.fromJson($window.localStorage[key])
        }
        catch(e)
        {
          ret = $window.localStorage[key];
        }
        return ret || defaultValue;
      },
      setObject: function(key, value) {
        $window.localStorage[key] = angular.toJson(value);
      },
      getObject: function(key, defaultValue) {
        return angular.fromJson($window.localStorage[key]) || defaultValue || {};
      }
    }
  });

/**
@fileOverview

@toc

*/

'use strict';

angular.module('tm.utils', [
  'tm.geolocation',
  'tm.consolelog',
  'tm.localstorage',
  'tm.ionic-parse'
]);
