/*
---
description: Sets an input value to equal the value selected in a select list when that list selection changes
provides: [Delegator.SelectToSet]
requires: [Behavior/Delegator]
name: Delegator.SelectToSet
...
*/
Delegator.register('change', {
  selectToSet: {
    handler: function(event, element, api){
      var target = api.getElement('target');
      target.set('value', element.getSelected()[0].get('value'));
    }
  }
});