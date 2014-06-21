/*
---

name: Fx.Progress

description: Tweens a progress bar width at the same time as updating a progress percentage.

license: MIT-style license.

requires:
 - Core/Fx.Tween

provides: [Fx.Progress]

...
*/

Fx.Progress = new Class({
  Extends: Fx.Tween,
  options: {
    unit: '%'
  },
  initialize: function(element, progressNum, options){
    this.progressNum = document.id(progressNum);
    this.parent(element, options);
  },
  render: function(element, property, value, unit){
    this.progressNum.set('html', value[0].value.toInt()+'%');
    this.parent(element, property, value, unit);
  }
});