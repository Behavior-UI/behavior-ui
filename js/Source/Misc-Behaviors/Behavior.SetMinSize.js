/*
---

name: Behavior.SetMinSize

description: Measures the heights of any number of elements and then sets the min-size of a specified target to the largest.

requires:
 - Core/Element.Style
 - More/Element.Measure
 - More/Events.Pseudos
 - Behavior/Behavior

provides: [Behavior.SetMinSize]

...
*/

(function(){

  var sizer = function(element, api){
    element.setStyle('min-height', '');
    var sizes = api.getElements('targets').map(function(target){
      return target.measure(function(){
        return this.getSize().y;
      });
    });
    element.setStyle('min-height', Math.max.apply(Math, sizes));
  };

  Behavior.addGlobalFilter('SetMinSize', {

    defaults: {
      targets: '>'
    },

    setup: function(element, api){
      // apply immediately
      sizer(element, api);
      // but then run it once more when Behavior has finished its
      // run through the DOM to accomodate to changes made to the DOM
      api.addEvent('apply:once', sizer.pass([element, api]));
      // finally, if this is the first time we're running and the page
      // hasn't loaded, run it again to provide time for layout rendering
      window.addEvent('load', sizer.pass([element, api]));

      return element;
    }

  });

})();

