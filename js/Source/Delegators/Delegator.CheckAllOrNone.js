/*
---
description: Checks all or none of a group of checkboxes.
provides: [Delegator.CheckAllOrNone]
requires: [Behavior/Delegator]
script: Delegator.CheckAllOrNone.js
name: Delegator.CheckAllOrNone

...
*/

Delegator.register('click', {

  'checkAll': {
    require: ['targets'],
    handler: function(event, link, api){
      var targets = link.getElements(api.get('targets'));
      if (targets.length) targets.set('checked', true);
      else api.warn('There were no inputs found to check.');
    }
  },

  'checkNone': {
    require: ['targets'],
    handler: function(event, link, api){
      var targets = link.getElements(api.get('targets'));
      if (targets.length) targets.set('checked', false);
      else api.warn('There were no inputs found to uncheck.');
    }
  },

  'checkToggleAll': {
    require: ['targets'],
    handler: function(event, link, api){
      var classTarget = api.get('classTarget');
      var classForTarget = api.get('class');
      var targets = link.getElements(api.get('targets'));
      if (targets.length){
        if (link.get('data-state') == undefined) api.error('Must specify an initial state as data-state.');
        if (link.get('data-state') == '1'){
          targets.set('checked', false);
          link.set('data-state', '0');
          if (classTarget && classForTarget){
            if (!targets.getElement(classTarget)) api.fail('Could not find classTarget: ' + classTarget)
            targets.getElement(classTarget).removeClass(classForTarget);
          }
        } else {
          targets.set('checked', true);
          link.set('data-state', '1');
          if (classTarget && classForTarget){
            if (!targets.getElement(classTarget)) api.fail('Could not find classTarget: ' + classTarget)
            targets.getElement(classTarget).addClass(classForTarget);
          }
        }
      }
      else api.warn('There were no inputs found to uncheck.');
    }
  }

});