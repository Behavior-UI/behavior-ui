/*
---

name: Behavior.Invoke

description: Behavior for invoking an action for a delegated event

requires:
 - Behavior/Behavior
 - Core/Element.Delegation

provides: [Behavior.Invoke]

...
*/


/*
  Example: watch child elements of a form for clicks or change and then invoke
  a method on an element relative to the one that was clicked/changed:

  this example would watch all inputs and selects for click/change and
  then find the element matching '!tr .foo-btn' relative to the element clicked
  and call .removeClass('btn-grey') on that element.
 <form data-behavior="Invoke"
   data-invoke-options="{
     'events':[
       'click:relay(input)',
       'change:relay(select)'
       ],
     'action':'removeClass',
     'args':['btn-grey'],
     'targets':'!tr .foo-btn'
   }">
  </form>


  Example: same as above, but on the element itself:
  <input data-behavior="Invoke"
    data-invoke-options="
      {
        'events': ['click'],
        'action': 'removeClass',
        'args': ['btn-grey'],
        'targets': '!tr .foo-btn'
      }
    "
  />
*/


Behavior.addGlobalFilter('Invoke', {
  defaults: {
    events: ['click'],
    args: []
  },
  requireAs: {
    action: String,
    args: Array
  },
  setup: function(element, api){
    var eventHandler = function(event, el){
      var targets;
      if (api.get('targets')) targets = api.getElements('targets');
      else if (api.get('targetsFromEventTarget')) targets = el.getElements(api.get('targetsFromEventTarget'));
      if (!targets.length) api.fail('could not get target elements for invoke filter for selector ' + api.get('targets'));
      targets.each(function(target){
        target[api.get('action')].apply(target, api.get('args'));
      });
    };
    api.get('events').each(function(selector){
      element.addEvent(selector, eventHandler);
    });
    return element;
  }
});
