/*
---

name: Delegator.Invoke.Toggle

description: Delegator for invoking two actions for a delegated event

requires:
 - Behavior/Delegator

provides: [Delegator.Invoke.Toggle]

...
*/


/*
  <a data-trigger="invoke.toggle"
    data-invoke-toggle-options="
      'target': 'self', //default
      'condition':{
        'method': 'get',
        'args': ['html'],
        'value': 'On'
      },
      'on': {
        'method': 'removeClass',
        'args': ['someClass']
      },
      'off': {
        'method': 'removeClass',
        'args': ['someClass']
      }
    "
  />
*/


Delegator.register('click', {
  'invoke.toggle': {
    requireAs: {
      on: Object,
      off: Object
    },
    handler: function(event, element, api){
      var target = element;
      if (api.get('target')) target = api.getElements('target');
      var condition = api.getAs(Object, 'condition'),
          on = api.getAs(Object, 'on'),
          off = api.getAs(Object, 'off');
      var hide = target[0][condition.method].apply(target[0], condition.args || []) == condition.value;
      var action = hide ? off : on;
      target[action.method].apply(target, action.args);
    }
  }
});
