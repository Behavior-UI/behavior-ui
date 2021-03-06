/*
---

name: Behavior.Filter

description: Filters a DOM element as the user types.

requires:
 - Behavior/Behavior
 - /Thanx.Filter

provides: [Behavior.Filter]

...
*/

Behavior.addGlobalFilter('Filter', {
  setup: function(el, api){
    api.getElements('items'); //throws error if no items are found.

    var filter = new Thanx.Filter(el,
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