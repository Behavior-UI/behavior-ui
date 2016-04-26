/*
---

name: Delegator.SetSlide

description: Delegator for controlling a Slides-based Behavior

requires:
 - Behavior/Delegator
 - Behavior.Slides

provides: [Delegator.SetSlide]

...
*/

Delegator.register('click', {
  setSlide: {
    requireAs: {
      target: String,
      slide: Number
    },
    defaults: {
      slide: 0
    },
    handler: function(event, element, api){

      var target = api.getElement('target');
      var instance;
      target.getBehaviors().each(function(behavior){
        instance = target.getBehaviorResult(behavior);
        // this allows for any subclass of Slides to work
        if (instanceOf(instance, Slides)){
          instance.show(api.getAs(Number, 'slide'));
          if (instance.options.autoPlay) instance.play(); // to reset the timer
        }
      });
    }
  }
});
