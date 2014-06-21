/*
---

name: Behavior.FlatUI.Select

description: Converts select lists into HTML rendered UIs per FlatUI.

requires:
 - Behavior/Behavior
 - /FlatUI.Select

provides: [Behavior.FlatUI.Select]

...
*/

Behavior.addGlobalFilter('FlatUI.Select', {
  setup: function(el, api){
    var select = new FlatUI.Select(el,
      Object.cleanValues(
        api.getAs({
          menuClass: String,
          buttonClass: String,
          arrowClass: String,
          noneSelectedText : String,
          closeOnEsc: Boolean
        })
      )
    );
    select.addEvent('select', function(option, event){
      if (el.getTriggers().length){
        var delegator = api.getDelegator();
        if (!delegator) return;
        event.type = 'change';
        delegator._eventHandler(event, el);
      }
    });
    if (el.hasClass('disabled')) select.disable();
    api.onCleanup(select.destroy.bind(select));
    return select;
  }
});