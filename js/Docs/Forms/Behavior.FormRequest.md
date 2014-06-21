Behavior Filter: Behavior.FormRequest
=================================

Creates an instance of [Form.Request][] for an element using the `FormRequest` data filter.

### Example

	<form data-behavior="FormRequest" data-formrequest-options="
	  'update': '+.#target', //see additional targeting options below
	  'filter': 'div.someSubsetOfTheResponse'
	">
		<input name="foo" type="text"/>
		<input type="submit"/>
	</form>
	<div id="target">My content is replaced by the form response</div>

### Required Settings

* update - (*string*; **required**) The target element to update with the form response; any of the update values specified in the section below.

### Options

* filter - (*string*) If specified, the response tree will have this selector applied to it and the target will be filled with the result. I.e. if you specified `div.foo` as a filter and the response had a div with the class `foo` somewhere in it, only that div would be placed into the target.
* resetForm - (*boolean*) If `true` (the default) the form is reset when it is submitted.

### Update Values

The `update` option can have the following values:

* `self` - this will have the form replace its own contents.
* `parent` - the form will update it's parent. It's also acceptable to use the CSS selector supported by [Slick](https://github.com/mootools/slick) for selecting parent nodes (`<`).
* *selector* - a selector that is run from the form. In the example above, for instance, the selector is `+.#target` which says find my next sibling which has the id `target`.

[Drag]: http://mootools.net/docs/more/Drag/Drag#Element:makeResizable