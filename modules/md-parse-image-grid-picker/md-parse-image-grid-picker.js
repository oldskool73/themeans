'use strict';

angular.module('tm.md-parse-image-grid-picker', [
  'tm.parse',
  'ngMaterial'
])
.directive('parseImageGridPicker', [
  '$window',
  function ($window) {
    return {
      template: '<md-grid-list '+
        'md-cols="{{ mdCols || 3 }}" '+
        'md-cols-sm="{{ mdColsSm || \'\' }}" '+
        'md-cols-md="{{ mdColsMd || \'\' }}" '+
        'md-cols-lg="{{ mdColsLg || \'\' }}" '+
        'md-gutter="{{ mdGutter || \'10px\' }}" '+
        'md-row-height="{{ mdRowHeight || \'1:1\' }}">'+

        '<md-grid-tile '+
          'md-rowspan="{{ mdRowSpan || 1 }}" '+
          'md-colspan="{{ mdColSpan || 1 }}" '+
          'md-rowspan-sm="{{ mdRowSpanSm || \'\' }}" '+
          'md-rowspan-md="{{ mdRowSpanMd || \'\' }}" '+
          'md-rowspan-lg="{{ mdRowSpanLg || \'\' }}" '+
          'md-colspan-sm="{{ mdColSpanSm || \'\' }}" '+
          'md-colspan-md="{{ mdColSpanMd || \'\' }}" '+
          'md-colspan-lg="{{ mdColSpanLg || \'\' }}" '+
          'ng-if="gallery.length" '+
          'ng-repeat="file in gallery track by $index">'+
          '<img ng-src="{{ file._url }}" style="width: inherit; height: inherit;" />'+
        '</md-grid-tile>'+

        '<md-grid-tile '+
          'md-rowspan="{{ mdRowSpan || 1 }}" '+
          'md-colspan="{{ mdColSpan || 1 }}" '+
          'md-rowspan-sm="{{ mdRowSpanSm || \'\' }}" '+
          'md-rowspan-md="{{ mdRowSpanMd || \'\' }}" '+
          'md-rowspan-lg="{{ mdRowSpanLg || \'\' }}" '+
          'md-colspan-sm="{{ mdColSpanSm || \'\' }}" '+
          'md-colspan-md="{{ mdColSpanMd || \'\' }}" '+
          'md-colspan-lg="{{ mdColSpanLg || \'\' }}">'+
          // custom placeholder image
          '<img '+
            'style="width: inherit; height: inherit; padding: {{ imagePlaceHolderPadding }};" '+
            'ng-show="placeHolder.length" '+
            'ng-src="{{placeHolder}}">'+
          // default placeholder image
          '<img style="width: inherit; height: inherit; padding: 40px;" '+
            'ng-show="!placeHolder.length" '+
            'ng-src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9Ijk3LjM0MXB4IiBoZWlnaHQ9IjEwMHB4IiB2aWV3Qm94PSIwIDAgOTcuMzQxIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgOTcuMzQxIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGc+PHBhdGggZD0iTTAsMTAwaDY2Ljg1MlYxOS4zNzJIMFYxMDB6IE00LjU3MiwyNC44ODZINjIuMjhWODEuNTJINC41NzJWMjQuODg2eiIvPjxwb2x5Z29uIHBvaW50cz0iMzAuODk4LDAgMjguOTgzLDE3LjIyMyAzMy41ODMsMTcuMjIzIDM0LjgzMyw1Ljk4NiA5Mi4xODgsMTIuMzYzIDg1LjkyOSw2OC42NSA2OC43ODEsNjYuNzQzIDY4Ljc4MSw4NS4zMzYgICAgODguNDMxLDg3LjUyMiA5Ny4zNDEsNy4zODcgICIvPjwvZz48L3N2Zz4=">'+

          '<md-button style="position: absolute; left: {{ buttonSvgLeft || \'144px\' }}; top: {{ buttonSvgRight || \'65px\' }};" '+
            'class="md-fab md-mini md-primary" '+
            'aria-label="Add Gallery Image" '+
            'ng-disabled="loading" '+
            'ng-click="getFile()">'+
            '<md-icon md-svg-src="images/shared/icons/plus.svg"></md-icon>'+
          '</md-button>'+
        '</md-grid-tile>'+
      '</md-grid-list>'+
      '<div style="height: 0px;width:0px; overflow:hidden;">' +
        '<input ' +
          'id="upfile" ' +
          'type="file" ' +
          'name="image" ' +
          'onchange="angular.element(this).scope().imageInputOnChange(this)"/>' +
      '</div>',
      restrict: 'E',
      scope: {
        // ng model
        gallery: '=resultsArray',

        // md grid responsive customisation
        // <md-grid-list>
        mdCols: '@',
        mdColsSm: '@',
        mdColsMd: '@',
        mdColsLg: '@',
        mdGutter: '@',
        mdRowHeight: '@',
        // <md-grid-tile>
        mdRowSpan: '@',
        mdColSpan: '@',
        mdRowSpanSm: '@',
        mdRowSpanMd: '@',
        mdRowSpanLg: '@',
        mdColSpanSm: '@',
        mdColSpanMd: '@',
        mdColSpanLg: '@',

        // cropper customisation
        cropper: '=',
        cropAspectRatio: '=',
        cropHeight: '=',
        cropWidth: '=',

        // image urls & callback
        buttonSvgIconUrl: '@',
        buttonSvgLeft: '@',
        buttonSvgRight: '@',
        imagePlaceHolder: '@',
        imagePlaceHolderPadding: '@',
        onSuccessCallback: '=',
      },
      link: {
        pre: function preLink() { // @params(scope, element, attrs)
        },
        post: function postLink() { // @params(scope, element, attrs)
        },
      },
      controller: [
        'Parse',
        '$scope',
        '$mdDialog',
        '$q',
        function (Parse, $scope, $mdDialog, $q) {

          $scope.loading = false;

          $scope.getFile = function() {

            document.getElementById('upfile').click();
          };

          function createParseFile(fileName, data) {
            var deferred  = $q.defer(),
                cleanName = fileName.replace(/[^a-zA-Z0-9]+/gi, '-');

            $scope.image = new Parse.File(cleanName, data);
            $scope.image.save({
              success: function (response) {
                deferred.resolve(response);
              },
              error: function (response, err) {
                deferred.reject(err);
              }
            });
            return deferred.promise;
          }
          $scope.imageInputOnChange = function (input) {
            var file = input.files[0];
            if (!file || !file.name)
            {
              return;
            }
            var name = file.name;

            $scope.$evalAsync(function () {
              $scope.loading = true;
            });

            if (!$scope.cropper)
            {
              createParseFile(name, file)
              .then(function (response) {

                $scope.loading = false;
                $scope.gallery.push(response);
                $scope.onSuccessCallback(response);

              }, function () {
                $scope.loading = false;
                $mdDialog.show(
                  $mdDialog
                    .alert()
                    .title('Server Error')
                    .content('There has been an error with the remote server, try uploading the file again')
                    .ok('Close'));
              });
              return;
            }
            $mdDialog.show({
              template: '<md-dialog>' +
                '<md-content>' +
                  '<img>' +
                '</md-content>' +
                '<div class="md-actions">' +
                  '<md-button ng-click="saveCrop()">' +
                    'Save' +
                  '</md-button>' +
                  '<md-button ng-click="closeDialog()">' +
                    'Close' +
                  '</md-button>' +
                '</div>' +
              '</md-dialog>',
              locals: {
                file: file,
                aspectRatio: $scope.aspectRatio,
                cropHeight: $scope.cropHeight,
                cropWidth: $scope.cropWidth
              },
              controller: [
                '$scope',
                'file',
                'aspectRatio',
                'cropHeight',
                'cropWidth',
                function ($scope, file, aspectRatio, cropHeight, cropWidth) {
                  $scope.file = file;
                  $scope.aspectRatio = aspectRatio;
                  $scope.cropHeight = cropHeight;
                  $scope.cropWidth = cropWidth;

                  $scope.saveCrop = function () {
                    var dataURI = $scope.canvas.cropper('getDataURL', {
                      width: $scope.cropWidth,
                      height: $scope.cropHeight
                    });
                    $mdDialog.hide(dataURI);
                  };
                  $scope.closeDialog = function () {
                    $mdDialog.cancel();
                  };
                }
              ],
              onComplete: function (scope, element) { // @params(scope, element, options)
                scope.imgEl = element[0].getElementsByTagName('img')[0];
                var cropperOptions = {};

                if (scope.aspectRatio)
                {
                  cropperOptions.aspectRatio = scope.aspectRatio;
                }
                var reader = new FileReader();

                reader.onload = function () {
                  // @params(event)
                  if (reader.readyState === reader.DONE)
                  {
                    scope.canvas  = $window
                                    .jQuery(scope.imgEl)
                                    .cropper(cropperOptions)
                                    .cropper('replace', reader.result);
                  }
                };
                reader.readAsDataURL(scope.file);
              }
            })
            .then(function (dataURI) {
              createParseFile(name, { base64: dataURI })
              .then(function (response) {

                $scope.loading = false;
                $scope.gallery.push(response);
                $scope.onSuccessCallback(response);

              }, function () {
                $scope.loading = false;
                $mdDialog.show(
                  $mdDialog
                    .alert()
                    .title('Server Error')
                    .content('There has been an error with the remote server, try uploading the file again')
                    .ok('Close'));
              });
            }, function () {
              $scope.loading = false;
            });
          };
        }
      ]
    };
  }
]);
