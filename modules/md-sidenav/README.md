# themeans
This is a set of generics that we use for some setup etc.

### Quickstart controller directive configuration
```
  // This html id selector gets passed into tm-md-sidenav directive to
  // set which element to offset the side-nav's height positioning by.
  //// (Designed to offset a sidenav by, say, a topbar).
  $scope.offsetElementId = 'some-html-element-id';

  // angular-md classes
  $scope.mdSidenavClass = 'md-sidenav-left md-whiteframe-z2';
  $scope.mdComponentId = 'left';
  $scope.mdIsLockedOpen = '$media(\'gt-md\')';
  $scope.mdButtonClass = 'md-default-theme md-primary md-hue-2';
  $scope.navObjects = [
    {
      title: 'Title 1',
      url: '#/titleone'
    },
    {
      title: 'Title 2',
      url: '#/titletwo'
    }
  ];
```
