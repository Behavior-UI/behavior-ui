/*
---

name: Slider.Modify

description: Extends Slider, allowing it to modify DOM elements based on the value
             of the slider.

license: MIT-Style
authors:
  - Davy Wentworth

requires:
  - More/Slider
  - Behavior-UI/Number

provides: [Slider.Modify]

...
*/

/*
    Example input for targets:
      'targets': [
        {
          'selector': '!body #html-example',
          'property': 'html',
          'operators': [
            {'operate': ['pow', 2]},
            {'humanize': [{'decimalsLessThanBase': false}]}
          ],
          'completeClass': 'complete'
        },
        {
          'selector': '!body #value-example',
          'property': 'value'
        },
        {
          'selector': '!body #simple-operator',
          'operators': [{
            'operate': ['*', 7]
          }]
        }
      ]
*/

Slider.Modify = new Class({
  Extends: Slider,
  options: {
    // slideFill: Element,
    targets: [],

    onMove: function(){
      this.updateSlideFill();
      this.updateTargets();
    },

    onComplete: function(){
      this.targets.each(function(target){
        if (target['completeClass'] && target['element']) target['element'].addClass(target['completeClass']);
      });
    }
  },
  initialize: function(element, knob, options){
    this.targets = options.targets;
    this.slideFill = document.id(options.slideFill);
    this.parent(element, knob, options);
    this.buildTargets();
  },

  buildTargets: function(){
    this.targets.each(function(target){
      target['element'] = this.element.getElement(target['selector']);
      if (!target['element'] && console && console.warn) console.warn('Unable to find target from selector '+target['selector']);
    }, this);
  },

  updateSlideFill: function(){
    var knobWidth = this.knob.getSize()[this.axis].toInt()/2;
    var pos = 'top';
    var dimension = 'height';
    if (this.axis == 'x'){
      pos = 'left';
      dimension = 'width';
    }
    var knobCenter = this.knob.getStyle(pos).toInt() + knobWidth;
    if (this.slideFill) this.slideFill.setStyle(dimension, knobCenter+"px");
  },

  updateTargets: function(){
    this.targets.each(this.updateTarget, this);
  },

  updateTarget: function(target){
    var modifiedCount = this.step;
    var property = target['property'] || 'html';

    if (target['operators']){
      target['operators'].each(function(operatorObj){
        Object.each(operatorObj, function(params, operator){
          modifiedCount = this.applyOperator(modifiedCount, operator, params);
        }, this);
      }, this);
    }

    if (target['completeClass'] && target['element']) target['element'].removeClass(target['completeClass']);

    if (target['element']) target['element'].set(property, modifiedCount);
  },

  applyOperator: function(modifiedCount, operator, params){
    // ensure the 'this' for apply is the Number.
    return modifiedCount[operator].apply(modifiedCount, params);
  }
});
