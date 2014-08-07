/*
---

name: Delegator.CharsRemaining

description: Changing an input (with a maxlength property) will decrement a target's value

requires:
 - Behavior/Delegator

provides: [Delegator.CharsRemaining]

...
*/


Delegator.register('keyup', {
  charsRemaining: {
    requireAs: {
      target: String
    },
    handler: function(event, element, api){
      var target = api.getElement('target');
      var maxChars = element.get('maxlength');
      if (!maxChars) api.fail('Could not read maxlength property of element.');
      var difference = maxChars - element.get('value').length;
      target.set('html', difference);
    }
  }
});
