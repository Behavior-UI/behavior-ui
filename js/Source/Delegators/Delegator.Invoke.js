/*
---

name: Delegator.Invoke

description: Delegator for invoking an action for a delegated event

requires:
 - Behavior/Delegator

provides: [Delegator.Invoke]

...
*/


/*
  <input data-trigger="invoke"
    data-invoke-options="
      {
        'action': 'removeClass',
        'args': ['someClass'],
        'targets': '!.some-parent .some-child-of-that-parent'
      }
    "
  />
*/


Delegator.register('click', {
  invoke: {
    defaults: {
      args: []
    },
    requireAs: {
      action: String,
      args: Array,
      targets: String
    },
    handler: function(event, element, api){
      api.getElements('targets').each(function(target){
        target[api.get('action')].apply(target, api.get('args'));
      });
    }
  }
});
