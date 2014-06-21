Behavior Filter: Behavior.OverText
===================================

Creates an instance of [OverText][] for an element using the `OverText` data filter.

### Example

	<input data-behavior="OverText" title="test"/>

### Note

The OverText label tag that gets created inherits the css classes of the target element of the filter with "overText-" prepended. If you have an input with the css class `foo` the label will have the class `OverText-foo`. This allows you to style specific labels. The same thing is true of additional data-behavior properties on the input. If the input has the data-behavior `Foo` then the label will also have the `overText-Foo` class.

### Events

The OverText filter attaches to the events provided by the Behavior instance a listener for the event `layout:display` which, when fired, will cause the OverText instance to update its position.

[OverText]: http://mootools.net/docs/more/Forms/OverText