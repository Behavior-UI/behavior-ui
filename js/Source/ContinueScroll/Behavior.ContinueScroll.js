/*
---

name: Behavior.ContinueScroll

description: Continues scrolling an element if the user has scrolled past
  a threshold. Otherwise, scroll back to the starting position.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - ContinueScroll

provides: [Behavior.ContinueScroll]

...
*/

Behavior.addGlobalFilter('ContinueScroll', {

  defaults: {
    scrollAxis: 'y',
    transition: 'expo:in:out',
    threshold: 0.1,
    completeClass: 'finished-scrolling'
  },

  returns: ContinueScroll,

  setup: function(element, api){
    var options = Object.cleanValues(
      api.getAs({
        scrollAxis: String,
        threshold: Number,
        transition: String,
        completeClass: String
      })
    );
    var scroller = new ContinueScroll(element);

    element.addEvent('topLeftComplete', function(){
      element.removeClass(options.completeClass);
    });

    element.addEvent('bottomRightComplete', function(){
      element.addClass(options.completeClass);
    });

    api.onCleanup(function(){
      scroller.detach();
    });

    return scroller;
  }
});
