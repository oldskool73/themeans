'use strict';
/**
 * @ngdoc service
 * @name tm.ionic-ng-camera
 * @description
 * # Camera
 * Service that wraps the cordova camera in an angular service.
 */
angular.module('tm.ionic-ng-camera', ['ionic']).service('tmCamera', [
  '$q',
  '$ionicPlatform',
  '$log',
  '$window',
  function ($q, $ionicPlatform, $log, $window) {
    var defaults = {};
    // Camera is not available on the window until platform is ready.
    $ionicPlatform.ready(function () {
      if (!$window.Camera) {
        return;
      }
      defaults = {
        sourceType: $window.Camera.PictureSourceType.CAMERA,
        correctOrientation: true,
        quality: 75,
        targetWidth: 350,
        targetHeight: 350,
        destinationType: $window.Camera.DestinationType.DATA_URL,
        encodingType: $window.Camera.EncodingType.PNG,
        saveToPhotoAlbum: false
      };
    });
    this.takePicture = function (cameraOptions) {
      var deferred = $q.defer();
      if (!navigator || !navigator.camera) {
        $log.error('Camera error: could not find navigator or navigator.camera object');
        return deferred.reject({ message: 'Unable to use camera, please try again or contact support.' });
      }
      cameraOptions = cameraOptions ? cameraOptions : {};
      // merge passed in options with defaults
      angular.extend(defaults, cameraOptions);
      navigator.camera.getPicture(onSuccess, onFail, defaults);
      function onSuccess(imageData) {
        if (defaults.destinationType === 0) {
          return deferred.resolve('data:image/png;base64,' + imageData);
        }
        deferred.resolve(imageData);
      }
      function onFail(message) {
        if (message === 'no image selected') {
          return deferred.resolve();
        }
        deferred.reject({ message: message });
      }
      return deferred.promise;
    };
    return this;
  }
]);