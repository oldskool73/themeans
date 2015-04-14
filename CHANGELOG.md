# 2.0.0

## Features

  #### input-tags
  - now supports both md & ionic with switchable templates

  #### [NEW] md-parse-image-grid-picker
  - add images into a customisable grid (gallery).

  #### [NEW] ionic-ng-camera
  - angular service wrapper for cordova ngCamera plugin

  #### parse-profiles-service
  - getProfiles function now accepts query options as an arguements which allows for dynamically
    selecting any parse query.
    CODE EXAMPLE:
    ```
    var queryOptions = [{
      func: 'equalTo',
      args: ['objectId', 'SH32SA53']
    }];
    ```

## Bug Fixes

  #### input-tags
  - Backspacing while adding a tag wont remove a tag anymore
  - Now propery checks for correct type, preventing typeErrors
  - Removed the ability to add blank tags

## Breaking Changes

  #### parse-profiles-service
    - Removed getNeighbouringProfiles function.

################################################################################################
################################################################################################

# 1.0.0

## Features

## Bug Fixes

## Breaking Changes
