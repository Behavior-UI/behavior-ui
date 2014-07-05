
<div class="jumbotron">
  <p><img src="<%= ActionController::Base.helpers.asset_path 'behavior_ui/images/behavior-ui-logo.png' %>" width="100" height="100"></p>
  <p>Interface driven behavioral markup powered by <a href="http://mootools.net">MooTools</a> and <a href="http://getbootstrap.com">Bootstrap</a> brought to you by <a href="http://thanx.com">Thanx</a>.</p>
  <pre class="prettyprint" data-behavior="BS.Tooltip" title="I'm a tooltip!">&lt;a data-behavior="BS.Tooltip" title="I'm a tooltip!">I've got a tip!&lt;/a>      Go ahead, try it! Mouse over this code block!</pre>
</div>

# Overview

Behavior UI is a set of UI components based on [Bootstrap](http://getbootstrap.com/) and (optionally) [Flat UI](http://designmodo.github.io/Flat-UI/) coupled with a JavaScript framework for building interactive components with a inline declaration for their invocation.

## Getting Behavior UI

The project is [available on github](http://github.com/behavior-ui/behavior-ui).

You can download it and use [nodejs](http://nodejs.org/) to compile the components into a single, stand-alone js file or [use the one found in the /dist directory](https://raw.githubusercontent.com/Behavior-UI/behavior-ui/master/dist/js/behavior-ui.js). The less components are vanilla Bootstrap in almost all cases. There are a few styles to be found in the repo on github that we will soon be packaging as well.

## What's In Behavior UI

Behavior UI is built on top of Bootstrap and Flat-UI and offers very few additions to those libraries. Most of what's include is JavaScript with a modest amount of LESS/CSS content to support it.

### Styles

There are a handful of LESS components included in the library nearly all of which support custom UI components. These include, but are not limited to:

* **Autocomplete** styles for the Autocomplete component [[demo](<%= sandbox_dir_file_path('JavaScript', 'Forms', 'Behavior.Autocomplete') %>)]
* **Charts** styles for our customized version of [HighCharts](http://www.highcharts.com) [[demo](<%= sandbox_dir_file_path('JavaScript', 'Charts', 'Charts_-_Basic_usage') %>)]
* **Date picker** styles for our customized version of Arian Stolwijk's [DatePicker](https://github.com/arian/mootools-datepicker/) [[demo](<%= sandbox_dir_file_path('JavaScript', 'Forms', 'Behavior.DatePicker') %>)]

### JavaScript

Behavior UI has numerous dependencies each of which have their own documentation that you may find useful to peruse.

#### MooTools

Behavior UI is built with [MooTools](http://mootools.net). You'll find loads of information in the [documentation for MooTools Core](http://mootools.net/docs/core) and the [documentation for MooTools More](http://mootools.net/docs/more).

Key to the UI is the use of MooTools classes and the use of the [Behavior](http://github.com/anutron/behavior) library to invoke them.

#### Behavior

The other key component to this UI library is Behavior. As [outlined in the docs for that library](https://github.com/anutron/behavior/blob/master/README.md):

> Behavior attempts to abstract that domready code into something you only write once and use often. It's fast and easily customized and extended. Instead of having a domready block that, say, finds all the images on a page and turns them into a gallery, and another block that searches the page for all the links on the page and turns them into tool tips, Behavior does a single search for all the elements you've marked. Each element is passed through the filter it names, where a filter is a function (and perhaps some configuration) that you've named. Each of these functions takes that element, reads properties defined on it in a prescribed manner and invokes the appropriate UI component.

It would be very much worth your time to [go read the rest of that document](https://github.com/anutron/behavior/blob/master/README.md).

## License

Behavior UI is provided with the [MIT license](<%= sandbox_about_path('license') %>).
