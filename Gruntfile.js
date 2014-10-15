"use strict";

module.exports = function(grunt) {


  require('load-grunt-tasks')(grunt);

  var browser = process.env.BROWSER;

  var sourceFiles = [
    'bower_components/mootools-core/Source/**/*.js',
    'bower_components/mootools-more/Source/**/*.js',
    'bower_components/behavior/Source/*.js',
    'js/Source/**/*.js',
    'js/Source/*.js'
  ];

  grunt.initConfig({

    dev: 'dist/dev',

    prod: 'dist/prod',

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
          Core: 'bower_components/mootools-core',
          More: 'bower_components/mootools-more',
          Behavior: 'bower_components/behavior',
          'Behavior-UI': 'js/'
        }
      },

      all: {
        src: sourceFiles,
        only: [
          'Behavior-UI/*',
          'Behavior/*'
        ],
        dest: '<%= dev %>/js/behavior-ui.js'
      }

    },

    clean: {
      all: {
        src: ['<%= dev %>/js/*.js', '<%= prod %>/js/*.js']
      }
    },

    watch: {
      js: {
        files: sourceFiles,
        tasks: ['packager:all']
      }
    },

    less: {
      compileBootstrap: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: 'behavior-ui-bootstrap.css.map',
          sourceMapFilename: '<%= dev %>/bootstrap/css/behavior-ui-bootstrap.css.map'
        },
        files: {
          '<%= dev %>/bootstrap/css/behavior-ui-bootstrap.css': 'less/behavior-ui-bootstrap.less'
        }
      },
      compileFlatUI: {
        options: {
          strictMath: false,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: 'behavior-ui-flatui.css.map',
          sourceMapFilename: '<%= dev %>/flat-ui/css/behavior-ui-flatui.css.map'
        },
        files: {
          '<%= dev %>/flat-ui/css/behavior-ui-flatui.css': 'less/behavior-ui-flatui.less'
        }
      }
    },

    copy: {
      copyBootstrap: {
        files: [
          {
            expand: true,
            cwd: 'bower_components/bootstrap/fonts',
            src: '**/*',
            dest: '<%= dev %>/bootstrap/fonts/'
          },{
            expand: true,
            cwd: 'assets/fonts',
            src: '**/*',
            dest: '<%= dev %>/bootstrap/fonts'
          },{
            expand: true,
            cwd: 'assets/images',
            src: '**/*',
            dest: '<%= dev %>/bootstrap/images'
          }
        ]
      },
      copyFlatUI:{
        files: [
          {
             expand: true,
             cwd: 'bower_components/flat-ui-official/images/',
             src: '**/*',
             dest: '<%= dev %>/flat-ui/images/'
          },{
            expand: true,
            cwd: 'bower_components/flat-ui-official/fonts/',
            src: '**/*',
            dest: '<%= dev %>/flat-ui/fonts/'
          },{
            expand: true,
            cwd: 'assets/fonts',
            src: '**/*',
            dest: '<%= dev %>/flat-ui/fonts'
          },{
            expand: true,
            cwd: 'assets/images',
            src: '**/*',
            dest: '<%= dev %>/flat-ui/images'
          }
        ]
      },
      copyProdBootstrap: {
        files: [
          {
            expand: true,
            cwd: '<%= dev %>/bootstrap/fonts/',
            src: '**/*',
            dest:'<%= prod %>/bootstrap/fonts'
          },{
            expand: true,
            cwd: '<%= dev %>/bootstrap/images/',
            src: '**/*',
            dest:'<%= prod %>/bootstrap/images'
          }
        ]
      },
      copyProdFlatUI: {
        files: [
          {
            expand: true,
            cwd: '<%= dev %>/flat-ui/fonts/',
            src: '**/*',
            dest:'<%= prod %>/flat-ui/fonts'
          },{
            expand: true,
            cwd: '<%= dev %>/flat-ui/images/',
            src: '**/*',
            dest:'<%= prod %>/flat-ui/images'
          }
        ]
      }
    },

    uglify: {
      options: {
        compress: true,
        preserveComments: "some"
      },
      prodJs: {
        files: {
          '<%= prod %>/js/behavior-ui.js': ['<%= dev %>/js/behavior-ui.js']
        }
      }
    },

    cssmin: {
      prodBootstrap: {
        files: {
          '<%= prod %>/bootstrap/css/behavior-ui-bootstrap.css': ['<%= dev %>/bootstrap/css/behavior-ui-bootstrap.css']
        }
      },
      prodFlatUI: {
        files: {
          '<%= prod %>/flat-ui/css/behavior-ui-flatui.css': ['<%= dev %>/flat-ui/css/behavior-ui-flatui.css']
        }
      }
    }

  });

  grunt.registerTask('default', ['bower:install', 'clean', 'packager:all']);
  grunt.registerTask('less-compile', ['less:compileBootstrap', 'less:compileFlatUI']);
  grunt.registerTask('copy-assets', ['copy:copyBootstrap','copy:copyFlatUI']);

  grunt.registerTask('dev', function(){
    grunt.task.run(['default','less-compile','copy-assets']);
  });

  grunt.registerTask('prod',function(){
    grunt.task.run(['dev',
                    'uglify:prodJs',
                    'cssmin:prodBootstrap',
                    'cssmin:prodFlatUI',
                    'copy:copyProdBootstrap',
                    'copy:copyProdFlatUI'
                   ]);
  });
};


