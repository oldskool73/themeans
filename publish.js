/* jshint node:true */

'use strict';

var fs = require('fs');

module.exports = function() {

  var modulesName = [];
  if (fs.existsSync(__dirname + '/dist/sub')){
    modulesName = fs.readdirSync(__dirname + '/dist/sub');
  }

  function makingComponentData(memo, name){
    memo[name] = {
      name: 'themeans-' + name,
      main: './' + name + '.js'
    };

    switch(name){
      case 'ionic-parse':
        memo[name].dependencies = {
          "angular":"~1.3.0",
          "parse": "1.3.1",
          "parse-angular-patch": "master"
        };
        break;
      case 'ionic-parse-login':
        memo[name].dependencies = {
          "themeans-ionic-parse": "https://github.com/amay0048/themeans.git#bower-ionic-parse"
        };
        break;
      case 'md-parse-login':
      memo[name].dependencies = {
        "themeans-ionic-parse": "https://github.com/amay0048/themeans.git#bower-ionic-parse",
        "angular-material": "master"
      };
      break;
    }

    return memo;
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
