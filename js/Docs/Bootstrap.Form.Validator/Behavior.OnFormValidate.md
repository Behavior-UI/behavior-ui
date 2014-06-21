/*
---

name: Behavior.OnFormValidate

description: When a form is valid, invokes a method.

requires:
 - Behavior/Behavior
 - Behavior/Delegator.verifyTargets

provides: [Behavior.OnFormValidate]

...
*/


/*

	<button data-behavior="OnFormValidate" data-onformvalidate-options="
		'checkOnStart': true,
		'onSuccess': [{
			method: 'addClass',
			arguments: ['bar']
		}],
		'onError': [{
			method: 'addClass',
			args: ['baz']
		}]
	">


*/

Behavior.addGlobalFilter('OnFormValidate', {
	defaults: {
		checkOnStart: true
	},
	setup: function(element, api){
		var checking;
		// get the form to monitor
		var form = api.get('target') ? api.getElement('target') : element.getParent('form');
		if (!form || !form.retrieve('validator')) api.fail('Could not find form or form validator instance for element');
		// fetch it's validator
		var validator = form.retrieve('validator');

		// method to check the state of the form and then invoke the proper handler
		var check = function(){
			checking = true;
			// if there are any elements that have failed, the form is invalid.
			var valid = !form.getElements('.validation-failed').length;
			// otherwise, go check all the inputs and immediately hide any messages that might otherwise display
			if (valid){
				valid = validator.validate();
				validator.reset();
			}
			// get the appropriate action set
			var action;
			if (valid && api.get('onSuccess')) action = 'onSuccess';
			else if (api.get('onError')) action = 'onError';

			// invoke the method described
			if (action){
				var actions = api.getAs(Array, action);
				actions.each(function(obj){
					element[obj['method']].apply(element, obj['args']);
				});
			}
			checking = false;
		};


		validator.addEvent('onElementValidate', function(){
			if (!checking) check.delay(100);
		});
		if (api.get('checkOnStart')) check();
		// for lack of a better thing to return, return the validator
		return validator;
	}
});

