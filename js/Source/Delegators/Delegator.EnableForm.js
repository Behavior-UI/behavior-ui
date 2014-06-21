/*
---

name: Delegator.EnableForm

description: Delegator for enabling all form inputs and selects for the target form,
             unless that input has data-remain-locked set

requires:
 - Behavior/Delegator

provides: [Delegator.EnableForm]

...
*/

// <div class="locked"
//   data-trigger="enableForm"
//   data-enableform-options="'target': '!div#programs form#merchant_programs'"
//   <i class="icon-lock icon-white"></i>
// </div>

Delegator.register('click', {
  enableForm: {
    defaults: {
      inputSelector: 'input:not([data-remain-locked]), select:not([data-remain-locked]), textarea:not([data-remain-locked])'
    },
    requireAs: {
      target: String
    },
    handler: function(event, element, api){
      var target =  api.getElement('target');
      api.fireEvent('formUnlock', [target]);
      target.getElements(api.get('inputSelector')).set('disabled', false);
    }
  }
});