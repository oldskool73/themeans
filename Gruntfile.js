'use strict';

module.exports = function (grunt) {

  // Loading external tasks
  require('load-grunt-tasks')(grunt);

  // Default task.
  grunt.registerTask('default', ['jshint', 'karma:unit']);
  grunt.registerTask('serve', [ 'karma:continuous', 'dist:main', 'dist:demo', 'build:gh-pages', 'connect:continuous', 'watch']);

  grunt.registerTask('dist', ['dist:main', 'dist:sub', 'dist:npm', 'dist:demo']);
  grunt.registerTask('dist:main', ['concat:tmp', 'concat:modules', 'clean:rm_tmp', 'uglify:main']);
  grunt.registerTask('dist:sub', ['ngmin', 'uglify:sub']);
  // grunt.registerTask('dist:npm', ['cjsify','replace:npm','uglify:npm']);
  grunt.registerTask('dist:npm', ['cjsify','replace:npm']);
  grunt.registerTask('dist:demo', ['concat:html_doc', 'copy']);


  // HACK TO ACCESS TO THE COMPONENT-PUBLISHER
  function fakeTargetTask(prefix){
    return function(){

      if (this.args.length !== 1) return grunt.log.fail('Just give the name of the ' + prefix + ' you want like :\ngrunt ' + prefix + ':bower');

      var done = this.async();
      var spawn = require('child_process').spawn;
      var src = './node_modules/angular-ui-publisher';
      if(['package','subpackage'].indexOf(this.args[0]) >= 0)
      {
        src = './node_modules/npm-publisher';
      }

      spawn('./node_modules/.bin/gulp', [ prefix, '--branch='+this.args[0] ].concat(grunt.option.flags()), {
        cwd : src,
        stdio: 'inherit'
      }).on('close', done);
    };
  }

  grunt.registerTask('build', fakeTargetTask('build'));
  grunt.registerTask('publish', fakeTargetTask('publish'));
  //


  // HACK TO LIST ALL THE MODULE NAMES
  var moduleNames = grunt.file.expand({ cwd: 'modules' }, ['*','!utils.js']);
  function ngMinModulesConfig(memo, moduleName){

     memo[moduleName]= {
      expand: true,
      cwd: 'modules/' + moduleName,
      src: ['*.js'],
      dest: 'dist/sub/' + moduleName
    };

    return memo;
  }
  //

  // HACK TO LIST ALL THE MODULE NAMES
  var packageNames = grunt.file.expand({ cwd: 'packages' }, ['*','!utils.js']);
  function commonJsConfig(memo, moduleName){

    //First set up the common build layer.
    memo[moduleName] = {
      src:['packages/'+moduleName+'/'+moduleName+'.js'],
      dest: 'dist/npm/'+moduleName+'/'+moduleName+'.js'
    };

    return memo;
  }
  //

  function npmReplaceConfig(memo, moduleName){

    memo.push({
      expand:true, 
      flatten:true, 
      src: ['dist/npm/'+moduleName+'/*.js'], 
      dest: 'dist/npm/'+moduleName+'/'
    });

    return memo;
  }


  // HACK TO MAKE TRAVIS WORK
  var testConfig = function(configFile, customOptions) {
    var options = { configFile: configFile, singleRun: true };
    var travisOptions = process.env.TRAVIS && { browsers: ['Firefox', 'PhantomJS'], reporters: ['dots'] };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };
  //


  // Project configuration.
  grunt.initConfig({
    bower: 'bower_components',
    dist : '<%= bower %>/angular-ui-docs',
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: ['/**',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' */',
        ''].join('\n')
    },

    watch: {

      src: {
        files: ['modules/**/*.js', '!modules/**/test/*Spec.js', 'demo/**/*.js'],
        tasks: ['jshint:src', 'karma:unit:run', 'dist:main', 'dist:demo', 'build:gh-pages']
      },
      test: {
        files: ['modules/**/test/*Spec.js'],
        tasks: ['jshint:test', 'karma:unit:run']
      },
      demo: {
        files: ['modules/**/demo/*'],
        tasks: ['jshint:src', 'dist:demo', 'build:gh-pages']
      },
      livereload: {
        files: ['out/built/gh-pages/**/*'],
        options: { livereload: true }
      }
    },

    connect: {
      options: {
        base : 'out/built/gh-pages',
        open: true,
        livereload: true
      },
      server: { options: { keepalive: true } },
      continuous: { options: { keepalive: false } }
    },

    karma: {
      unit: testConfig('test/karma.conf.js'),
      server: {configFile: 'test/karma.conf.js'},
      continuous: {configFile: 'test/karma.conf.js',  background: true }
    },

    concat: {
      html_doc: {
        options: {
          banner: ['<!-- Le content - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
            '================================================== -->',
            '<div id="utils" ng-app="doc.ui-utils">', ''
          ].join('\n  '),
          footer : '</div>'},
        src: [ 'modules/**/demo/index.html'],
        dest: 'demo/demos.html'
      },
      tmp: {
        files: {  'tmp/dep.js': [ 'modules/**/*.js', '!modules/utils.js', '!modules/ie-shiv/*.js', '!modules/**/test/*.js']}
      },
      modules: {
        options: {banner: '<%= meta.banner %>'},
        files: {
          'dist/main/tm-utils.js': ['tmp/dep.js', 'modules/utils.js'],
          'dist/main/tm-utils-ieshiv.js' : ['modules/ie-shiv/*.js']
        }
      }
    },
    uglify: {
      options: {banner: '<%= meta.banner %>'},
      main: {
        files: {
          'dist/main/tm-utils.min.js': ['dist/main/tm-utils.js'],
          'dist/main/tm-utils-ieshiv.min.js': ['dist/main/tm-utils-ieshiv.js']
        }
      },
      sub: {
        expand: true,
        cwd: 'dist/sub/',
        src: ['**/*.js'],
        ext: '.min.js',
        dest: 'dist/sub/'
      },
      npm: {
        expand: true,
        cwd: 'dist/npm/',
        src: ['**/*.js'],
        ext: '.min.js',
        dest: 'dist/npm/'
      }
    },
    clean: {
      rm_tmp: {src: ['tmp']}
    },
    jshint: {
      src: {
        files:{ src : ['modules/**/*.js', '!modules/**/test/*Spec.js','demo/**/*.js'] },
        options: { jshintrc: '.jshintrc' }
      },
      test: {
        files:{ src : [ 'modules/**/test/*Spec.js', 'gruntFile.js'] },
        options: grunt.util._.extend({}, grunt.file.readJSON('.jshintrc'), {
          node: true,
          globals: {
            angular: false,
            inject: false,
            jQuery: false,

            jasmine: false,
            afterEach: false,
            beforeEach: false,
            ddescribe: false,
            describe: false,
            expect: false,
            iit: false,
            it: false,
            spyOn: false,
            xdescribe: false,
            xit: false
          }
        })
      }
    },
    copy: {
      main: {
        files: [
          // UI.Include needs a external html source.
          {src: ['modules/include/demo/fragments.html'], dest: 'demo/fragments.html', filter: 'isFile'}
        ]
      }
    },
    cjsify: packageNames.reduce(commonJsConfig, {
      options: {
        // Task-specific options go here.
        export: 'exports'
      }
    }),
    replace:{
      npm: {
        options: {
          patterns: [
            {
              match: '}.call(this, this));',
              replacement: '}.call(this, module));'
            },
            {
              match: '(function (global) {',
              replacement: 'if(typeof Parse.requie === "undefined"){Parse.require = require;}(function (global) {'
            }
          ],
          usePrefix: false
        },
        files: packageNames.reduce(npmReplaceConfig, [])
      }
    },
    ngmin: moduleNames.reduce(ngMinModulesConfig, {}),
    changelog: { options: { dest: 'CHANGELOG.md' } }
  });

};
