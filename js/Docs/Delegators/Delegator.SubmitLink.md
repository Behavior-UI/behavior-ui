Delegator Trigger: submitLink
=======================

Submits a target form with optional additional data.

### Example

	<form>
		<input type="text" name="firstName" value="fred"/>
		<a data-trigger="submitLink" data-submitlink-options="'extraData': {'lastName':'Flintstone'}">I'm a Flintstone!</a>
		<a data-trigger="submitLink" data-submitlink-options="'extraData': {'lastName':'Rogers'}">I'm a Rogers!</a>
	</form>

### Options

* extraData - (*object*) Encodes additional data into the form. These are actually added as hidden inputs and then sent along.
* form - (*string*; defaults to `!form`) A selector run through `getElement` on the element with the trigger specified. Use [reversed combinators](https://github.com/mootools/slick/wiki/reversed-combinators) to search for parents.

### Notes

This integrates well with Behavior.FormRequest (the Behavior filter for making forms ajax-y).

