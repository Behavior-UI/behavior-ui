/*
---
description: Provides methods to reveal, dissolve, nix, and toggle using Fx.Reveal.
provides: [Delegator.FxReveal, Delegator.Reveal, Delegator.ToggleReveal, Delegator.Dissolve, Delegator.Nix, Delegator.Fx.Reveal]
requires: [Behavior/Delegator, More/Fx.Reveal]
script: Delegator.Fx.Reveal.js
name: Delegator.Fx.Reveal

...
*/
(function(){

  var triggers = {};

  ['reveal', 'toggleReveal', 'dissolve', 'nix'].each(function(action){

    triggers[action] = {
      handler: function(event, link, api){
        var targets;
        if (api.get('target')){
          targets = new Elements([api.getElement('target')]);
        } else if (api.get('targets')){
          targets = api.getElements('targets');
        } else {
          targets = new Elements([link]);
        }

        var fxOptions = api.getAs(Object, 'fxOptions');
        if (fxOptions){
          targets.each(function(target){
            target.get('reveal').setOptions(fxOptions);
          });
        }
        if (action == 'toggleReveal') targets.get('reveal').invoke('toggle');
        else targets[action]();
        if (!api.getAs(Boolean, 'allowEvent')) event.preventDefault();
      }
    };

  });

  Delegator.register('click', triggers);

})();