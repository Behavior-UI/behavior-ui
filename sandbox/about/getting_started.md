# Getting Started

Using Behavior UI requires only that you include the JavaScript and the styles in your page. Once included, you then can declare the desired behavior for various UI components inline with options in the HTML tags themselves. Here's a very, very simple example:


<pre class="prettyprint">
&lt;!DOCTYPE html>
&lt;html>
  &lt;head>
    &lt;title>Behavior-UI UI 101 Template&lt;/title>
    &lt;link href="behavior-ui-bootstrap.css" media="screen" rel="stylesheet" />
  &lt;/head>
  &lt;body>

    &lt;a data-behavior="BS.Tooltip" title="I'm a tooltip!">I've got a tip!&lt;/a>

    &lt;script src="behavior-ui.js">&lt;/script>
  &lt;/body>
&lt;/html>
</pre>

Which would give you something like this:

<a data-behavior="BS.Tooltip" title="I'm a tooltip!">I've got a tip!</a>

## Go Dig In The Sandbox

In the examples you'll find many, many UI components to choose from. Most of the components found in Boostrap are present including [modals](<%= sandbox_dir_file_path('JavaScript', 'Alerts and Modals', 'Modals') %>), [tooltips](<%= sandbox_dir_file_path('JavaScript', 'Tips and Popovers', 'Tooltips') %>) and more, but also numerous components from MooTools More ([FormValidator](<%= sandbox_dir_file_path('JavaScript', 'Forms', 'Behavior.FormRequest') %>), [FormRequest](<%= sandbox_dir_file_path('JavaScript', 'Forms', 'Behavior.FormValidator') %>), etc.). Further, there are Delegators ([read up on delegator in its docs](https://github.com/anutron/behavior/blob/master/Docs/Delegator.md)) for [ajax](<%= sandbox_dir_file_path('JavaScript', 'Delegators', 'Delegator.Ajax') %>) and the like.

## Getting The Hang of Behavior and Delegator

You should first go read the [README for Behavior](https://github.com/anutron/behavior/blob/master/README.md) as it provides a solid overview of the library. It's the code that allows you to invoke these UI patterns with inline HTML. You don't really need to dig into Behavior's code so much if you only want to use the included components here, but it is useful to understand *what it does* as you use it. Here, then, is the nutshell of what Behavior and its companion Delegator do:

### Behavior

`Behavior` parses your HTML content and invokes JavaScript with the options you specify, turning a form into an ajax form, or an input into a date picker. This means that you *never* write any custom `DomReady` JavaScript. You declare everything inline. This provides a lot of benefits outlined in the Behavior documentation. If you wish to write your own Behaviors then you should dig into the documentation and demos. You can find these in the github repo. The chunks of JavaScript you write to describe one of these available configurations is called a *Behavior filter*.

### Delegator

`Behavior` is for instantiating UI components when your page loads or when you fetch new content with Ajax. `Delegator` is for intercepting events (like when the user clicks something or fills out a form) and performing an action. Most of the Delegator triggers that are included here intercept these kinds of actions - clicks, form submission, changes to inputs, etc. The chunks of JavaScript you write to describe one of these available configurations is called a *Delegator trigger*.

## Building UIs with Behavior and Delegator

One of the many benefits you get to adopting this style of development is that over time you write less and less JavaScript as the startup code that is bound to your DOM is likely to re-use something you've already written. If you need a Delegator trigger that hides an element when you click it, you can just as easily make it so that clicking an element hides any other element. The next time you need to hide something, you already have a trigger for it. As you run into new problems that you don't have triggers and filters for, you'll write new tools for yourself and be that much less likely to need to write JavaScript for the next page you build.

## Behavior UI Provides A Lot Out Of The Box

Much of what you need to build a UI is already here for you to use. Part of stringing it all together though is about figuring out how to use `Behavior` and `Delegator` together, how to add your own components to the library, and when.

Included in the Behavior library itself you'll find a few special components that provide a great deal of power for building UIs. The first is `Behavior.Startup` and the other are the `Invoke` components - `Behavior.Invoke` and `Delegator.Invoke`.

### Behavior.Startup

In a nutshell, `Behavior.Startup` allows you to invoke a Delegator trigger when the page loads (instead of waiting for the user to click a button for example). This allows you to, for example, select a tab in a Tab UI when the page loads, or show a tooltip when the page loads.

### Invoke

The other super-handy component is the `Invoke` component (available as both a [Behavior filter](<%= sandbox_dir_file_path('JavaScript', 'General Use Behaviors', 'Behavior.Invoke') %>) and a [Delegator](<%= sandbox_dir_file_path('JavaScript', 'Delegators', 'Delegator.Invoke') %>) trigger). These allow you to invoke an element method upon any target element or elements. This includes [all the methods supplied by MooTools](http://mootools.net/docs/core/Element/Element) and beyond. This single component will probably save you having to write many a custom handler if you think about what you're building carefully.

## Writing Your Own Behaviors And Delegators

When is the right time to author your own Behavior filters and Delegator triggers? The short answer is when there isn't something there already that will accomplish the task, or, when you wish to simplify the pattern you're using. Because of generic things like `Behavior.Invoke` as well as complex stuff like the switches and conditionals possible with `Delegator`, it's possible to do quite a lot using just them. But while it may be possible, it may make your HTML cumbersome to manage with large JSON configurations inline. When you reach a complex problem like this, or you encounter a pattern that you really can't express with the filters and triggers included here, it's best to just go write a new one.

The basic concept of authoring a Behavior is to replace what you'd put in a `DomReady` statement. Instead of this:

<pre class="prettyprint">
window.addEvent('domready', function(){
  $$('form').each(function(form){
    new FormValidator(form, someOptions);
    new Form.Request(form, someOptions);
  });
});
</pre>

You would create Behavior filters for these:

<pre class="prettyprint">
Behavior.addGlobalFilter('Form.Validator', {
  setup: function(element, api){
    return new FormValidator(element,
      Object.cleanValues(
        api.getAs({
          someOption: String,
          someNumber: Number,
          etc
        })
      })
    );
  }
});
</pre>

A Delegator is much the same only instead of it finding an element and turning it into an interactive component, it is handed an element and event and performs an action (i.e. user clicks a link and the link changes color). As such it doesn't tend to return an instance of anything. The documentation found at [github.com/anutron/behavior/](https://github.com/anutron/behavior/) includes lots of examples. The code included in this repository includes many, many more, so if you want to write some custom filters or triggers, look to them for examples.

## Building the Library

You can use the `grunt` configuration in the [behavior-ui github repo](https://github.com/Behavior-UI/behavior-ui) to build the output files that you'll find in the `/dist` directory there, but chances are you'll want to build your own using only the parts you need. Until we get a builder set up, you can use the [grunt-mootools-packager](https://github.com/anutron/grunt-mootools-packager) to do it. See the `package.json`, `Gruntfile.js`, and `bower.json` files in the `behavior-ui` project for an example of what this looks like.
