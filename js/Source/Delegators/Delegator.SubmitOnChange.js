/*
---

name: Delegator.SubmitOnChange

description: Submits a form when an input within it is changed.

requires:
 - Behavior/Delegator

provides: [Delegator.SubmitOnChange]

...
*/

Delegator.register('change', 'submitOnChange', {
  defaults: {
    onlyOnce: true,
    spin: false
  },
  handler: function(event, element, api){
    var form = element;
    if (api.get('target')) form = api.getElement('target');
    if (api.get('onlyIfSet') && !element.get('value')) return;
    if (!api.getAs(Boolean, 'onlyOnce') || (api.get('onlyOnce') && !form.retrieve('submitted'))){
      form.fireEvent('submit').submit();
      if (api.getAs(Boolean, 'spin')) form.spin();
      form.store('submitted', true);
    }
  }

});
