/*
---
description: Prompts the user to confirm a link click.
provides: [Delegator.SpinAndConfirm]
requires: [/Delegator.Confirm, /Delegator.SpinOnClick]
name: Delegator.SpinAndConfirm

...
*/
Delegator.register('click', {
	spinAndConfirm: {
		handler: function(event, link, api){
			var popup = api.trigger('confirm', link, event);
			var spinner = api.trigger('spinOnClick', link, event);

			var keepSpinning = false;

			popup.element.getElements('.btn-ok').addEvent('click', function(){
				keepSpinning = true;
			});
			popup.addEvent('hide', function(){
				(function(){
					if (!keepSpinning) spinner.hide();
				}).delay(100);
			});
		}
	}
});