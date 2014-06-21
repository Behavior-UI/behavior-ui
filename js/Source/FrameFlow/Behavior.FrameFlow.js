/*
---

name: Behavior.FrameFlow

description: Provides a simplified Finite State Machine for managing UI flows in which
  transitions and states are encapsulated into Frame instances

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - FrameFlow

provides: [Behavior.FrameFlow]

...
*/

Behavior.addGlobalFilter('FrameFlow', {
  defaults: {
    startIndex: 0
  },

  returns: FrameFlow,

  setup: function(element, api){
    var frameFlow = new FrameFlow(element, Object.cleanValues(
      api.getAs({
        startIndex: Number
      })
    ));

    api.onCleanup(frameFlow.detach.bind(frameFlow));

    return frameFlow;
  }
});