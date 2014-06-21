/*
---

name: Delegator.SetSlide

description: Delegator for controlling a CSS3Slides-based Behavior

requires:
 - Behavior/Delegator

provides: [Delegator.SetSlide]

...
*/

Delegator.register('click', {
  setSlide: {
    requireAs: {
      target: String
    },
    defaults: {
      slide: 0
    },
    handler: function(event, element, api){

      var target = api.getElement('target');
      var instance;
      target.getBehaviors().each(function(behavior){
        instance = target.getBehaviorResult(behavior);
        if (instanceOf(instance, Slides)){
          instance.show(api.get('slide'));
          instance.play(); // to reset the timer
        }
      });
    }
  }
});
