/*
---
name: Delegator.SelectWithOther
description: Allows users to enter an "other" value for a select list.
provides: [Delegator.SelectWithOther, Behavior.FormValidatorChanges]
requires: [Behavior/Delegator, More/Fx.Reveal]
...
*/
Delegator.register('change', {
  selectWithOther: {
    requires: ['target'],
    defaults: {
      otherValue: 'other'
    },
    handler: function(event, element, api){
      var target = api.getElement('target');
      var after = function(){
        var b = api.getBehavior();
        if (b) b.fireEvent('formLayoutChange');
      };
      if (element.getSelected()[0].get('value') == api.get('otherValue')){
        target.reveal().get('reveal').chain(after);
      } else {
        target.dissolve().get('dissolve').chain(after);
      }
    }
  }
});

Behavior.addGlobalPlugin('FormValidator', 'FormValidatorChanges', function(element, api, fvInstance){
  var watcher = function(){
    fvInstance.reset().validate();
  };
  api.addEvent('formLayoutChange', watcher);
  api.onCleanup(function(){
    api.removeEvent('formLayoutChange', watcher);
  });
});