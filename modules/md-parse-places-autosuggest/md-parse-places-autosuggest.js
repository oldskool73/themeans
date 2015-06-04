'use strict';

/**
 * @ngdoc directive
 * @name creemWebApp.directive:mdParsePlacesAutosuggest
 * @description
 * # mdParsePlacesAutosuggest
 **** DOCS: https://developers.google.com/maps/documentation/javascript/places-autocomplete
 */
angular.module('tm.md-parse-places-autosuggest',[
  'uiGmapgoogle-maps',
  'tm.parse'
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
.directive('mdParsePlacesAutosuggest', function ($document) {

  return {
    template: '<md-autocomplete flex '+
                  'md-no-cache="true" '+
                  'md-selected-item="selectedItem" '+
                  'md-search-text="searchText" '+
                  'md-items="item in querySearch(searchText)" '+
                  'md-item-text="selectedItem.description" '+
                  'md-floating-label="{{label}}">'+
                '<span md-highlight-text="searchText">{{item.description}}</span>'+
              '</md-autocomplete>',
    restrict: 'E',
    scope: {
      selectedItem:'=ngModel',
      predictionsTypes: '=?',
      label:'@'
    },
    link: function(scope, el){
      scope.el = el;
      scope.tmpEl = $document[0].createElement('google-places-detail-tmp');
      /*
      ** Defining the searchText in the linking function seems to prevent any random values
      ** getting attached to this binding.
      *
      ** The MdAutoComplete class in angular-material.js doesn't seems to validate or check
      ** that the type is right before binding it to the dom, and I couldn't trace the
      ** reason a boolean was getting binded.
      *
      ** Note that declaring this binding in the controller does not work. It clears the
      ** value, but then causes the 'cear input' button to not function.
      */
      scope.searchText = '';
    },
    controller: function ($scope, $q, $timeout, uiGmapGoogleMapApi, Parse){

      $scope.lookupItem = {};
      $scope.validation = {
        loadingText: 'Loading address details...',
        deferred: $q.defer()
      };

      function placesSearch(searchText){
        var deferred = $q.defer();

        uiGmapGoogleMapApi.then(function (maps){
          var service = new maps.places.AutocompleteService(),
              types   = ['address'];

          if ($scope.predictionsTypes) {
            types = $scope.predictionsTypes;
          }

          service.getPlacePredictions({
            input: searchText,
            types: types,
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

      function fake(){
        $scope.validation.deferred = $q.defer();
        return $scope.validation.deferred.promise;
      }

      $scope.querySearch = function(searchText){
        if(searchText === $scope.validation.loadingText)
        {
          return fake();
        }
        if($scope.selectedItem
          && searchText === $scope.selectedItem.description)
        {
          return fake();
        }
        return placesSearch(searchText);
      };

      $scope.$watch('selectedItem',function (newVal, oldVal) {

        if(newVal && newVal.place_id)
        {
          // if(oldVal && newVal.description === oldVal.description)
          // {
          //   return $timeout(function () {
          //     $scope.validation.deferred.resolve([]);
          //     return $scope.validation.deferred.promise;
          //   }, 200);
          // }
          $scope.searchText = angular.copy($scope.validation.loadingText);

          uiGmapGoogleMapApi.then(function(maps){

            var service = new maps.places.PlacesService($scope.tmpEl);

            service.getDetails({
              placeId: newVal.place_id
            }, function (place, status) {
              if (status == maps.places.PlacesServiceStatus.OK)
              {
                newVal = angular.extend(newVal,place);
                newVal.geoPoint = new Parse.GeoPoint({
                    latitude: newVal.geometry.location.lat(),
                    longitude: newVal.geometry.location.lng()
                });
                delete newVal.html_attributions;
              }
              // Parse doesnt accept nested object keys with '$$'.
              delete newVal.$$hashKey;

              $timeout(function(){
                $scope.selectedItem = $scope.ngModel = newVal;
                $scope.validation.deferred.resolve([]);
                $scope.searchText = $scope.selectedItem.description;
              },0);
              $scope.validation.requesting = false;
            });

          });
        }
      });
    }

  };
});
