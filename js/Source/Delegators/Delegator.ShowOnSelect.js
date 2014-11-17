/*
---

name: Delegator.ShowOnSelect

description: ShowOnSelect trigger hides/shows a target element when it's corresponding
             option is selected.

requires:
 - Behavior/Delegator
 - Core/Element.Style

provides: [Delegator.ShowOnSelect]

...
*/

// ShowOnSelect trigger hides/shows a target element when it's corresponding
// option is selected. If the option does not reference a target, all are hidden.
// Option elements should specify a data-target selector relative to the select list
// OR specify an array of selectors in the behavior declaration

(function(){
  // hides all targets specified on options of the select list
  var hideAll = function(api, element){
    element.getElements('option').each(function(option){
      var targets = getTargetElements(api, element, option);
      if (targets.length){
        if (api.get('hideClass')) targets.addClass(api.get('hideClass'));
        else if (api.get('showClass')) targets.removeClass(api.get('showClass'));
        else targets.setStyle('display', 'none');

        // if disableInputs option is set, disable all nested input or
        // select elements of the given to-be-hidden target
        if(api.get('disableInputs')){
          targets.each(function(target){
            target.getElements('input, select:not([data-remain-locked])')
                  .set('disabled', 'true')
          });
        }
      }
    });
  };

  // function to get the element an option references
  var getTargetElements = function(api, element, option){
    // get the selector specific to the option
    if (option.get('data-target')) return element.getElements(option.get('data-target'));
    // if there isn't a data-target value on the option, get all the targets specified in the behavior
    // and the get the element at the same index as this option

    var selector = api.get('targets')[element.getElements('option').indexOf(option)];
    return selector ? element.getElements(selector) : [];
  };



  Delegator.register('change', {
    showOnSelect: {
      defaults: {
        // hideClass: '',
        // showClass: '',
        display: 'inline-block',
        disableInputs: false
      },
      handler: function(event, element, api){
        if (element.get('tag') != 'select') api.fail('ShowOnSelect only works on select elements.');

        // hide all the possible targets
        hideAll(api, element);
        // get the target that corresponds to the selected option
        var targets = getTargetElements(api, element, element.getSelected()[0]);

        if (targets.length){
          if (api.get('hideClass')) targets.removeClass(api.get('hideClass'));
          else if (api.get('showClass')) targets.addClass(api.get('showClass'));
          else targets.setStyle('display', api.get('display'));

          // if disableInputs option is set, reenable all nested input or
          // select elements of the given to-be-shown target
          if(api.get('disableInputs')){
            targets.each(function(target){
              target.getElements('input:not([data-remain-locked]), select:not([data-remain-locked])')
                    .set('disabled', '')
            });
          }
        }
      }
    }
  });
})();
