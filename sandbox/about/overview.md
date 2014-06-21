# Overview

<p class="lead">Thanx UI is a set of UI components based on <a href="http://getbootstrap.com/">Bootstrap</a> and <a href="http://designmodo.github.io/Flat-UI/">Flat UI</a> coupled with a JavaScript framework for building interactive components with a inline declaration for their invocation.</p>


## Getting Thanx UI

The project is [available on github](github.com/ThanxApp/thanx-ui) and as [a gem for Ruby on Rails](#TODO).

\#TODO - write some more about how to include it in a rails project, how to use the builder for JS, etc.

## What's In Thanx UI

Thanx UI is built on top of Bootstrap and Flat-UI and offers very few additions to those libraries. Most of what's include is JavaScript with a modest amount of LESS/CSS content to support it.

### Styles

There are a handful of LESS components included in the library nearly all of which support custom UI components. These include, but are not limited to:

* **Autocomplete** styles for the Autocomplete component [[demo](<%= sandbox_dir_file_path('JavaScript', 'Clientcide', 'Behavior.Autocomplete') %>)]
* **Charts** styles for our customized version of [HighCharts](http://www.highcharts.com) [[demo](<%= sandbox_dir_file_path('JavaScript', 'Thanx_Charts', 'Charts_-_Basic_usage') %>)]
* **Date picker** styles for our customized version of Arian Stolwijk's [DatePicker](https://github.com/arian/mootools-datepicker/) [[demo](<%= sandbox_dir_file_path('JavaScript', 'Thanx_Behaviors', 'Behavior.DatePicker') %>)]
* Custom styles for Bootstrap / Flat-UI components such as **modals** and **selects**
* Custom styles for the MooTools plugins such as **Form Validator**, **HtmlTable**, etc.
* A **CSS spinner** / indicator [[demo](<%= sandbox_dir_file_path('JavaScript', 'Visual_Assets', 'Spinner') %>)]

### JavaScript

Thanx UI has numerous dependencies each of which have their own documentation that you may find useful to peruse.

#### MooTools

Thanx UI is built with [MooTools](http://mootools.net). You'll find loads of information in the [documentation for MooTools Core](http://mootools.net/docs/core) and the [documentation for MooTools More](http://mootools.net/docs/more).

Key to the UI is the use of MooTools classes and the use of the [Behavior](http://github.com/anutron/behavior) library to invoke them.

#### Behavior

The other key component to this UI library is Behavior. As [outlined in the docs for that library](https://github.com/anutron/behavior/blob/master/README.md):

> Behavior attempts to abstract that domready code into something you only write once and use often. It's fast and easily customized and extended. Instead of having a domready block that, say, finds all the images on a page and turns them into a gallery, and another block that searches the page for all the links on the page and turns them into tool tips, Behavior does a single search for all the elements you've marked. Each element is passed through the filter it names, where a filter is a function (and perhaps some configuration) that you've named. Each of these functions takes that element, reads properties defined on it in a prescribed manner and invokes the appropriate UI component.

It would be very much worth your time to [go read the rest of that document](https://github.com/anutron/behavior/blob/master/README.md).

#### Clientcide

One of the principal authors of Thanx UI is Aaron Newton who has a set of plugins for MooTools available at [Clientcide.com](http://dev.clientcide.com). Some of these UI components are in use in this library. You can find documentation and demos of those components on his website as well as in the sandbox here. In addition to [dev.clientcide.com](http://dev.clientcide.com), which has demos/docs for numerous UI components, there is also [MooTools Bootstrap](http://dev.clientcide.com/?version=MooTools%20Bootstrap) by the same author, which reproduces most of the UI components found in [Bootstrap](http://getbootstrap.com) with MooTools.

## License

Thanx UI is copyright Thanx Inc, 2014 and is provided with the [MIT license](<%= sandbox_about_path('license') %>).
