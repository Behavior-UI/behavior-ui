"use strict";

module.exports = function(grunt) {


  require('load-grunt-tasks')(grunt);
  var browser = process.env.BROWSER;

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-debug-task');

  grunt.initConfig({
    bower: {
        install: {
          options: {
            install: true,
            copy: false
          }
        }
    },
    packager: {

      options: {
        name: {
          Core: 'node_modules/mootools-core',
          More: 'node_modules/mootools-more',
          Behavior: 'node_modules/behavior',
          'Behavior-UI': 'js/'
        }
      },

      all: {
        src: [
          'node_modules/mootools-core/Source/**/*.js',
          'node_modules/mootools-more/Source/**/*.js',
          'node_modules/behavior/Source/*.js',
          'js/Source/**/*.js',
          'js/Source/*.js'
        ],
        only: [
          'Behavior-UI/*',
          'Behavior/*'
        ],
        dest: 'dist/js/behavior-ui.js'
      }

    },

    clean: {
      all: {
        src: 'mootools-*.js'
      }
    },

    less: {
      compileBootstrap: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: 'behavior-ui-bootstrap.css.map',
          sourceMapFilename: 'dist/css/behavior-ui-bootstrap.css.map'
        },
        files: {
          'dist/css/behavior-ui-bootstrap.css': 'less/behavior-ui-bootstrap.less'
        }
      },
      compileFlatUI: {
        options: {
          strictMath: false,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: 'behavior-ui-flatui.css.map',
          sourceMapFilename: 'dist/css/behavior-ui-flatui.css.map'
        },
        files: {
          'dist/css/behavior-ui-flatui.css': 'less/behavior-ui-flatui.less'
        }
      }
    }

  });

  grunt.registerTask('default', ['bower:install', 'clean', 'packager:all']);
  grunt.registerTask('less-compile', ['less:compileBootstrap', 'less:compileFlatUI']);
};
