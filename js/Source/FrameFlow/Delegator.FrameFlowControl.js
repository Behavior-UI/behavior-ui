/*
---

name: Delegator.FrameFlowControl

description: Delegator for controlling a FrameFlow Behavior

requires:
 - Behavior/Delegator
 - FrameFlow

provides: [Delegator.FrameFlowControl]

...
*/

Delegator.register('click', {

  frameflowControl: {

    requireAs: {
      target: String,
      frame: String
    },

    defaults: {
      target: '!body .frameflow-container'
    },

    handler: function(event, element, api){

      var target = api.getElement('target');
      var frame = api.get('frame');
      if (!target.hasBehavior("FrameFlow")) api.fail(
        'Target does not have a FrameFlow Behavior.'
      );

      var ffInstance = target.getBehaviorResult("FrameFlow");
      ffInstance.transition(ffInstance.getFrameIndexBySelector(frame));
    }
  }
});
