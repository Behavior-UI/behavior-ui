/*
---

name: Behavior.ClickOutToHide

description: Behavior that removes an element when you click out of it.

requires:
 - Behavior/Behavior
 - Core/Element.Style

provides: [Behavior.ClickOutToHide]

...
*/

Behavior.addGlobalFilter('ClickOutToHide', {
  defaults: {
    useEscapeKey: true,
    destroyElement: false
  },
  setup: function(el, api){

    var destroy = function(){
      if (api.get('destroyElement')){
        api.cleanup(el);
        el.destroy();
      } else {
        el.setStyle('display', 'none');
      }
    };

    var events = {
      click: function(e){
        if (e.target != el && !el.contains(e.target)) destroy();
      }
    };
    if (api.get('useEscapeKey')){
      events.keyup = function(e){
        if (e.key == "esc") destroy();
      };
    }

    document.body.addEvents(events);
    api.onCleanup(function(){
      document.body.removeEvents(events);
    });

    return el;
  }
});