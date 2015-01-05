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
