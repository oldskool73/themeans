'use strict';
/**
 * @ngdoc directive
 * @name creemWebApp.directive:ionicParsePlacesAutosuggest
 * @description
 * # ionicParsePlacesAutosuggest
 */

angular.module('tm.ionic-parse-places-autosuggest', [
  'uiGmapgoogle-maps',
  'tm.parse',
  'ionic'
])
.config(function ($provide,uiGmapGoogleMapApiProvider) {
  var libraries = 'places';

  if(uiGmapGoogleMapApiProvider.options.libraries)
  {
    if(uiGmapGoogleMapApiProvider.options.libraries.indexOf('places') < 0)
    {
      libraries = uiGmapGoogleMapApiProvider.options.libraries+',places';
    }
    else
    {
      return;
    }
  }

  uiGmapGoogleMapApiProvider.configure({
      libraries: libraries
  });
})
.directive('ionicParsePlacesAutosuggest', function ($document) {

  return {
    template: '<label '+
      'class="item item-input item-stacked-label item-stacked-label" '+
      'ng-click="placesInputOnClick()">'+
      '<span '+
        'class="input-label" '+
        'placeholder="Enter your address">'+
          'Location:'+
      '</span>'+
      '<p>{{selectedItem.description}}</p>'+
    '</label>',
    restrict:'E',
    scope: {
      selectedItem: '=ngModel',
      predictionsTypes: '=?',
      label: '@'
    },
    link: function(scope, el){
      scope.el = el;
      scope.tmpEl = $document[0].createElement('google-places-detail-tmp');
    },
    controller: function ($scope, $timeout, $ionicModal, $q, uiGmapGoogleMapApi, Parse){
      $scope.predictions = [];

      $ionicModal.fromTemplateUrl('views/places-suggest.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.modal = modal;
      });

      // Pass some search text to the google maps api and get some places results
      function placesSearch(searchText){
        var deferred = $q.defer();

        uiGmapGoogleMapApi.then(function(maps){
          var service = new maps.places.AutocompleteService();

          service.getPlacePredictions({
            input: searchText,
            types: ['address'],
            componentRestrictions: {country: 'au'}
          }, function (predictions, status) {
            if (status != maps.places.PlacesServiceStatus.OK) {
              deferred.reject(status);
              return;
            }

            deferred.resolve(predictions);
          });

        });
        return deferred.promise;
      }

      function placesDetail(prediction, tmpEl){
        var deferred = $q.defer();

        uiGmapGoogleMapApi.then(function(maps){

          var service = new maps.places.PlacesService(tmpEl);

          service.getDetails({
            placeId: prediction.place_id
          }, function (place, status) {
            if (status == maps.places.PlacesServiceStatus.OK)
            {
              prediction = angular.extend(prediction,place);
              prediction.geoPoint = new Parse.GeoPoint({
                  latitude: prediction.geometry.location.k,
                  longitude: prediction.geometry.location.B
              });
              delete prediction.html_attributions;
            }
            // Parse doesnt accept nested object keys with '$$'.
            delete prediction.$$hashKey;

            deferred.resolve(prediction);
          });

        });
        return deferred.promise;
      }

      $scope.placesInputOnClick = function(){
        $scope.modal.show();
      };

      $scope.closeIconOnClick = function(){
        $scope.modal.hide();
      };

      $scope.enterAddressOnKeydown = function(queryString){
        if(queryString && queryString.length > 3)
        {
          placesSearch(queryString).then(function(predictions){
              $scope.predictions = predictions;
          });
        }
      };

      $scope.predictionOnClick = function(prediction){
        placesDetail(prediction, $scope.tmpEl).then(function (prediction) {
          $scope.ngModel = prediction;
          $scope.closeIconOnClick();
        });
      };
    }
  };
});
