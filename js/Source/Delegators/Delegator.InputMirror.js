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

Delegator.register(['change','keyup'], {
  inputMirror: {
    requireAs: {
      targets: Array
    },
    handler: function(event, element, api){
      var targets = api.get('targets');

      if (!targets && targets.length) api.fail('Unable to find targets option.');


      targets.each(function(target){
        var targetElement = element.getElement(target.selector);
        if (!targetElement) api.warn('Unable to find element for inputMirror selector: '+target.selector);
        if (targetElement && targetElement != element){
          targetElement.set(target.property || 'value', element.get('value'));
        }
      });
    }
  }
});
