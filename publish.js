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

  function makingComponentData(memo, name){
    memo[name] = {
      name: 'themeans-' + name,
      main: './' + name + '.js'
    };

    switch(name){
      case 'parse':
        memo[name].dependencies = {
          "angular":"~1.3.0",
          "parse": "master",
          "parse-angular-patch": "master"
        };
        break;
      case 'ionic-parse-login':
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse"
        };
        break;
      case 'md-parse-login':
        memo[name].dependencies = {
          "themeans-parse": "https://github.com/themeans/themeans.git#bower-parse",
          "angular-material": "master"
        };
        break;
      case 'parse-messages':
        memo[name].dependencies = {
          "angular-md5": "~0.1.7"
        };
        break;
    }

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

      bowerData : { main: './LKHJLKJHLKJHLKJH.js'},

      // The sub-components
      subcomponents : modulesName.reduce(makingComponentData, {}),
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