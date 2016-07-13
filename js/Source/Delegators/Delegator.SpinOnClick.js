/*
---
name: Delegator.SpinOnClick
description: Starts the Spinner on a target element when the source element is clicked.
provides: [Delegator.SpinOnClick, Delegator.UnSpinOnClick]
requires: [Behavior/Delegator, More/Spinner]
...
*/

Delegator.register('click', {

  spinOnClick: {
    defaults: {
      timeout: 0
    },
    handler: function(event, element, api){
      var target = element;
      if (api.get('target')) target = api.getElement('target');
      target.spin();
      var timeout = api.getAs(Number, 'timeout');
      if (timeout && timeout > 0) target.unspin.delay(timeout, target);
      return target.get('spinner');
    }
  },

  unSpinOnClick: {
    handler: function(event, element, api){
      var target = element;
      if (api.get('target')) target = api.getElement('target');
      target.unspin();
      return target.get('spinner');
    }
  }

});
