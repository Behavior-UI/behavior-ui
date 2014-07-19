# Overview

Behavior UI is a set of UI components based on [Bootstrap](http://getbootstrap.com/) and (optionally) [Flat UI](http://designmodo.github.io/Flat-UI/) coupled with a JavaScript framework for building interactive components with a inline declaration for their invocation.

## Contribute

You are welcome to contribute to Behavior-UI! What we ask of you:

a. __To report a bug:__

   1. Create a [jsFiddle](http://jsfiddle.net/) with the minimal amount of code to reproduce the bug.
   2. Create a [Github Issue](https://github.com/behavior-ui/behavior-ui/issues), and link to the jsFiddle.

b. __To fix a bug:__

   1. Clone the repo.
   2. Fix the bug.
   4. Run `grunt` to compile the distribution file(s).
   5. Push to your Github fork.
   6. Create Pull Request, and send Pull Request.


__Do try to contribute!__ This is a community project.

#### TO DO

See [TODO.md](TODO.md).

#### StyleGuide

This library follows the MooTools Style Guide with *one important exception*: It uses spaces, not tabs, for whitespace indentation.

* http://wiki.github.com/mootools/mootools-core/syntax-and-coding-style-conventions

## Building

Current build process uses [Grunt](http://github.com/gruntjs) and [Grunt MooTools Packager plugin](https://github.com/ibolmo/grunt-packager).

### Installation Prerequisites

You need to have grunt and bower installed in order to run through the build instructions below. Install them globally by doing:

    $ npm install bower -g        # installs bower globally
    $ npm install grunt -g        # installs grunt globally
    $ npm install grunt-cli -g    # installs the grunt command line interpreter which allows you to actually run grunt
   

### Installation, Building locally

    $ git clone https://github.com/behavior-ui/behavior-ui  # clone the repo
    $ cd behavior-ui                                        # get into the directory
    $ npm install                                           # install de testing tools
    $ bower install                                         # installs external dependencies
    $ grunt default                                         # build the /dist/js/behavior-ui file
