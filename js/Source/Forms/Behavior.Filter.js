/*
---

name: Behavior.Filter

description: Filters a DOM element as the user types.

requires:
 - Behavior/Behavior
 - Form.Filter

provides: [Behavior.Filter]

...
*/

Behavior.addGlobalFilter('Filter', {

  returns: Form.Filter,

  setup: function(el, api){
    api.getElements('items'); //throws error if no items are found.

    var filter = new Form.Filter(el,
      Object.cleanValues(
        api.getAs({
          items: String,
          text: String,
          hideClass: String,
          rateLimit: Number
        })
      )
    );
    api.onCleanup(function(){
      filter.detach();
    });
    return filter;
  }
});