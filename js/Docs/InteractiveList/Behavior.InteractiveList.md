/*
---

name: Behavior.InteractiveList

description: Behavior for showing a spinner when a form is submitted.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - /Thanx.InteractiveList

provides: [Behavior.InteractiveList]

...
*/

Behavior.addGlobalFilter('InteractiveList', {
  setup: function(element, api){
    var list = new Thanx.InteractiveList(element, Object.cleanValues(
        api.getAs({
          selectedClass: String,
          listItems: String,
          autoScroll: Boolean,
          scrollAxes: String,
          firstItemSelected: Boolean,
          doubleScroll: Boolean,
          scrollType: String,
          swipeToNext: Boolean
        })
      )
    );
    if (list.options.swipeToNext && !list.options.firstItemSelected) api.error('To use swipeToNext, you must enable firstItemSelected.')
    // mark the first element that has the selected class already as being so
    if (list && list.options.listItems) var items = element.getElements(list.options.listItems);
    var selected = items.filter('.' + list.options.selectedClass)[0];
    if (selected){
      list.currentlySelected = selected;
      list.select(selected);
    }

    list.addEvent('select', function(selectedEl){
      api.fireEvent('interactiveListSelect', [selectedEl, list]);
    });
    return list;
  }
});
