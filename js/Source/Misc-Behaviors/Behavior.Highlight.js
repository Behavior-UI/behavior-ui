/*
---

name: Behavior.Highlight

description: Highlights a DOM element that's been updated with Fx.Tween's .highlight function

requires:
 - Core/Fx.Tween
 - Behavior/Behavior

provides: [Behavior.Highlight]

...
*/

Behavior.addGlobalFilter('Highlight', {
  defaults: {
    // start: '#ffff88',
    // end: 'transparent',
    fxOptions: {
      duration: 1000
    }
  },
  setup: function(el, api){
    el.set('tween', api.get('fxOptions'));
    el.highlight(api.get('start'), api.get('end'));
    return el.get('tween');
  }
});