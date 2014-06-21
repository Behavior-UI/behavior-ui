/*
---
description: Creates an Fx.Accordion from any element with Accordion in its data-behavior property.
             Uses the .toggle elements within the element as the toggles and the .target elements as the targets.
provides: [Behavior.Accordion, Behavior.FxAccordion]
requires: [Behavior/Behavior, More/Fx.Accordion, Behavior/Element.Data, More/Object.Extras]
script: Behavior.Accordion.js
name: Behavior.Accordion
...
*/

Behavior.addGlobalFilter('Accordion', {
  deprecated: {
    headers:'toggler-elements',
    sections:'section-elements'
  },
  defaults: {
    // defaults from Fx.Accordion:
    display: 0,
    height: true,
    width: false,
    opacity: true,
    alwaysHide: false,
    trigger: 'click',
    initialDisplayFx: true,
    resetHeight: true,
    headers: '.header',
    sections: '.section'
  },
  returns: Fx.Accordion,
  setup: function(element, api){
    var options = Object.cleanValues(
      api.getAs({
        fixedHeight: Number,
        fixedWidth: Number,
        display: Number,
        show: Number,
        height: Boolean,
        width: Boolean,
        opacity: Boolean,
        alwaysHide: Boolean,
        trigger: String,
        initialDisplayFx: Boolean,
        resetHeight: Boolean
      })
    );
    var accordion = new Fx.Accordion(element.getElements(api.get('headers')), element.getElements(api.get('sections')), options);
    api.onCleanup(accordion.detach.bind(accordion));
    return accordion;
  }
});
