/*
---

name: Delegator.SpinOnSubmit

description: Delegator for showing a spinner when a form is submitted.

requires:
 - Behavior/Behavior
 - More/Spinner

provides: [Delegator.SpinOnSubmit]

...
*/

Delegator.register('submit', {
	spinOnSubmit: {
		handler: function(event, form, api){
			form.spin();
		}
	}
});