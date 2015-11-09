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
    // roundAfterSnap: null,
    targets: [],

    jumpstart: false,


    onMove: function(){
      this.updateSlideFill();
      this.updateTargets();
      this.addMoveClass();
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
    // not overwriting the Binds property from the parent class, so do this manually
    this.jumpstart = this._jumpstart.bind(this);
    this.parent(element, knob, options);
    this.buildTargets();
    this.updateSlideFill();
    if (this.options.roundAfterSnap){
      this.addEvent('complete', function(step){
        var target = (step / this.options.roundAfterSnap).round() * this.options.roundAfterSnap;
        if (step != target) this.set(target).fireEvent('afterSnap', step);
      }.bind(this));
    }
  },

  attach: function(){
    this.parent();
    if (this.options.jumpstart){
      var event = ('ontouchstart' in window) ? 'touchstart' : 'mousedown';
      this.element.addEvent(event, this.jumpstart);
      // remove mousedown handler added by Slider class;
      this.element.removeEvent('mousedown', this.clickedElement);
    }
  },

  detach: function(){
    this.element.removeEvents({
      touchstart: this.jumpstart,
      mousedown: this.jumpstart
    });
    return this.parent();
  },

  buildTargets: function(){
    this.targets.each(function(target){
      target['element'] = this.element.getElement(target['selector']);
      if (!target['element'] && console && console.warn) console.warn('Unable to find target from selector '+target['selector']);
    }, this);
  },

  addMoveClass: function(){
    if(this.options.moveClass && this.options.moveClassTargets){
      this.options.moveClassTargets.addClass(this.options.moveClass);
    }
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
    if (this.slideFill) this.slideFill.setStyle(dimension, knobCenter);
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
  },

  end: function(){
    if (this.jumpStarting) return this;
    return this.parent();
  },

  _jumpstart: function(event){
    this.jumpStarting = true;
    this.clickedElement(event);
    this.jumpStarting = false;
    this.drag.start(event);
  }

});
