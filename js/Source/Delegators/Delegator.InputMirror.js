/*
---

name: Delegator.InputMirror

description: Delegator for tying the values of two inputs together

requires:
 - Behavior/Delegator

provides: [Delegator.InputMirror]

...
*/

  // <input
  // data-trigger="inputMirror"
  // data-inputmirror-options="{
  //   'targets':'!body .cardspring-business-id'
  // }" >

Delegator.register('change', {
  inputMirror: {
    requireAs: {
      targets: String
    },
    defaults: {
      property: 'value'
    },
    handler: function(event, element, api){
      var targets = api.getElements('targets');
      targets.erase(element);
      if (targets.length == 0) api.fail("Could not find InputMirror's targets: ", api.get('targets'));
      targets.set(api.get('property'), element.get('value'));
    }
  }
});
