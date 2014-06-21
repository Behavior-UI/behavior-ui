/*
---
description: Provides methods to add/remove/toggle a class on a given target.
provides: [Delegator.ToggleClass, Delegator.AddClass, Delegator.RemoveClass, Delegator.AddRemoveClass]
requires: [Behavior/Delegator, Core/Element]
script: Delegator.AddRemoveClass.js
name: Delegator.AddRemoveClass

...
*/
(function(){

  var triggers = {};

  ['add', 'remove', 'toggle'].each(function(action){

    triggers[action + 'Class'] = {
      require: ['class'],
      handler: function(event, link, api){
        var target = link;

        if (api.get('target')) target = api.getElement('target')
        else if (api.get('targets')) target = api.getElements('targets');

        target[action + 'Class'](api.get('class'));
      }
    };

  });

  Delegator.register('click', triggers);

})();