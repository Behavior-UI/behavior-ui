/*
---

name: Behavior.FlatUI.Select

description: Converts select lists into HTML rendered UIs per FlatUI.

requires:
 - Behavior/Behavior
 - FlatUI.Select

provides: [Behavior.FlatUI.Select]

...
*/

(function(){

// the filter for both FlatUI.Select and FlatUI.Select.Filter
// is identical; the only difference is which class is used
var init = function(el, api, filterable){
  var klass = filterable ? FlatUI.Select.Filter : FlatUI.Select;
  var select = new klass(el,
    Object.cleanValues(
      api.getAs({
        menuClass: String,
        buttonClass: String,
        arrowClass: String,
        noneSelectedText : String,
        closeOnEsc: Boolean,
        containerClass: String
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
};

Behavior.addGlobalFilter('FlatUI.Select', {
  returns: FlatUI.Select,
  setup: function(el, api){
    return init(el, api);
  }
});

Behavior.addGlobalFilter('FlatUI.Select.Filter', {
  returns: FlatUI.Select.Filter,
  setup: function(el, api){
    return init(el, api, true);
  }
});


})();
