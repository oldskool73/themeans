/* jshint node:true */

'use strict';

var fs = require('fs');

module.exports = function() {

  var npmpub = false;
  if(process.mainModule.filename.indexOf('npm-publisher') >= 0)
  {
    npmpub = true;
  }

  var modulesName = [];
  if (fs.existsSync(__dirname + '/dist/sub')){
    modulesName = fs.readdirSync(__dirname + '/dist/sub');
  }

  if(npmpub && fs.existsSync(__dirname + '/dist/npm'))
  {
    modulesName = fs.readdirSync(__dirname + '/dist/npm');
  }

  function version(minor){
    return '0.1.'+minor;
  }

  function makingComponentData(memo, name){

    memo[name] = {
      name: 'themeans-' + name,
      main: './' + name + '.js'
    };

    switch(name){
      case 'parse':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "angular":"~1.3.0",
          "parse": "1.4.2",
          "parse-angular-patch": "master"
        };
        break;
      case 'ionic-parse-login':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "ionic": "~1",
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse"
        };
        break;
      case 'md-parse-login':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "cropper": "~0.8.0",
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "angular-material": "*"
        };
        break;
      case 'md-parse-image-picker':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "angular-material": "*"
        };
        break;
      case 'md-parse-places-autosuggest':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "angular-material": "*",
          "angular-google-maps": "~2.0.17"
        };
        break;
      case 'ionic-parse-places-autosuggest':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "ionic": "~1",
          "angular-google-maps": "~2.0.17"
        };
        break;
      case 'parse-messages':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "themeans-parse-profiles-service": "https://github.com/themeans/themeans.git#bower-parse-profiles-service",
          "themeans-parse-accounts-service": "https://github.com/themeans/themeans.git#bower-parse-accounts-service",
          "angular-md5": "~0.1.7"
        };
        break;
      case 'parse-profiles-service':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "themeans-localstorage": "https://github.com/themeans/themeans.git#bower-localstorage",
          "angular-md5": "~0.1.7"
        };
        break;
      case 'parse-accounts-service':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "themeans-localstorage": "https://github.com/themeans/themeans.git#bower-localstorage"
        };
        break;
      case 'global-ng-progress':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "ngprogress": "~1.0.7"
        };
        break;
      case 'ionic-ng-camera':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "ionic": "~1"
        };
        break;
      case 'md-parse-image-grid-picker':
        memo[name].version = version(0);
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "angular-material": "*"
        };
        break;
    }

    return memo;
  }

  function makingPackageData(memo, name){
    memo[name] = {
      name: 'themeans-' + name,
      main: './' + name + '.js'
    };

    // switch(name){
    //   case 'parse-email':
    //     memo[name].dependencies = {
    //       "mustache": "^1.1.0"
    //     };
    //     break;
    // }

    return memo;
  }

  if(process.mainModule.filename.indexOf('npm-publisher') >= 0)
  {
    return {
      // gh-pages stuff
      humaName : 'TM.Utils',
      repoName : 'tm-utils',
      // inlineHTML : fs.readFileSync(__dirname + '/demo/demos.html'),
      // inlineJS : fs.readFileSync(__dirname + '/demo/demo.js'),
      // gh-pages css dependencies
      // css : []
      // gh-pages js dependencies
      // js : ['dist/tm-utils.js'],

      // HACK...
      main_dist_dir: 'npm',

      bowerData : {},

      // The sub-components
      subcomponents : modulesName.reduce(makingPackageData, {}),
      // HACK...
      sub_dist_dir: 'npm'
    };
  }

  return {
    // gh-pages stuff
    humaName : 'TM.Utils',
    repoName : 'tm-utils',
    inlineHTML : fs.readFileSync(__dirname + '/demo/demos.html'),
    inlineJS : fs.readFileSync(__dirname + '/demo/demo.js'),
    // gh-pages css dependencies
    // css : []
    // gh-pages js dependencies
    js : ['dist/tm-utils.js'],


    // HACK...
    main_dist_dir: 'main',

    bowerData : { main: './tm-utils.js'},

    // The sub-components
    subcomponents : modulesName.reduce(makingComponentData, {}),
    // HACK...
    sub_dist_dir: 'sub'
  };
};
