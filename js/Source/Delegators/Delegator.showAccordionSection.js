
/*
---
description: Provides methods to set or toggle properties on target elements.
provides: [Delegator.setProperty, Delegator.eraseProperty, Delegator.toggleProperty]
requires: [Behavior/Delegator, Core/Element]
script: Delegator.SetProperty.js
name: Delegator.SetProperty

...
*/

Delegator.register('click', {
  'showAccordionSection': {
    requireAs: {
      // gotta tell it which section you want to show
      target: String
    },
    defaults: {
      // how to find the accordion instance
      // by convention, all selectors are relative to the element with
      // the trigger. this default assumes the clicked element is inside
      // the accordion.
      accordionSelector: '![data-behavior*=Accordion]'
    },
    handler: function(event, element, api){
      // find the target section to show
      var target = api.getElement('target');
      // we gotta find the accordion instance, so we look for
      var accordionElement = api.getElement('accordionSelector');
      // get the accordion instance from the element, created by Behavior
      var accordionInstance = accordionElement.getBehaviorResult('Accordion');
      // no accordion found? fail quietly
      if (!accordionInstance) api.fail('Could not retrieve Fx.Accordion instance from element', accordionElement);
      // not a section of the accordion? fail quietly
      if (accordionInstance.elements.indexOf(target) < 0) api.fail('Target element is not an accordion section', target);
      // show it!
      accordionInstance.display(target);
    }
  }
});
