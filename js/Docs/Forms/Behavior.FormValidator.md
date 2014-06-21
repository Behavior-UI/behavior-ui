Behavior Filter: Behavior.FormValidator
===================================

Creates an instance of [Form.Validator.Inline][] for an element using the `FormValidator` data filter.

### Example

	<form data-behavior="FormValidator" data-formrequest-options="
	  'stopOnFailure': false,
	  'serial': false
	  //etc
	">
		<input name="foo" type="text" data-validators="required"/>
		<input type="submit"/>
	</form>


### Options

* stopOnFailure - (*boolean*; defaults to `true`) If `true` (the default) the form will not submit if there is a validation error.
* useTitles - (*boolean*; defaults to `true`) Use the titles of inputs for the error message; overrides the messages defined in the InputValidators.
* evaluateOnSubmit - (*boolean*; defaults to `true`) Whether to validate the form when the user submits it.
* evaluateFieldsOnBlur - (*boolean*; defaults to `true`) Whether to validate the fields when the blur event fires.
* evaluateFieldsOnChange - (*boolean*; defaults to `true`) Whether to validate the fields when the change event fires
* serial - (*boolean*; defaults to `true`) Whether to validate other fields if one field fails validation unless the other fields' contents actually change (instead of onblur).
* ignoreHidden - (*boolean*; defaults to `true`) If `true` (the default), all fields that are not visible to the user (who are display:none or whose parents are `display:none`) are not validated.
* ignoreDisabled - (*boolean*; defaults to `true`) If `true` (the default), all disabled fields are not validated.
* scrollToErrorsOnSubmit - (*boolean*; defaults to `true`) If `true` (the default), when the user submits the form the window (or overflown parent) will scroll up to that element so it is in view. Will use [Fx.Scroll][] if it's available, otherwise it will jump to the element.
* scrollToErrorsOnBlur - (*boolean*; defaults to `false`) If `true` blur events will be attached to inputs, triggering a scroll to relevant errored field.
* scrollToErrorsOnChange - (*boolean*; defaults to `false`) If `true` change events will be attached to inputs, triggering a scroll to the relevant errored field.


[Form.Validator]: http://mootools.net/docs/more/Forms/Form.Validator.Inline