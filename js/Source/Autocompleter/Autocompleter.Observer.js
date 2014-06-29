/*
---
name: Autocompleter.Observer

description: Observe formelements for changes

version: 1.0rc3

license: MIT-style license
author: Harald Kirschner <mail [at] digitarald.de>
copyright: Author

requires: [Core/Class.Extras, Core/Element.Event, Core/JSON]

provides: [Autocompleter.Observer, Observer]

...
 */
var Observer = new Class({

  Implements: [Options, Events],

  options: {
    periodical: false,
    delay: 1000
  },

  initialize: function(el, onFired, options){
    this.setOptions(options);
    this.addEvent('onFired', onFired);
    this.element = document.id(el) || $$(el);
    /* Clientcide change */
    this.boundChange = this.changed.bind(this);
    this.resume();
  },

  changed: function(){
    var value = this.element.get('value');
    if ($equals(this.value, value)) return;
    this.clear();
    this.value = value;
    this.timeout = this.onFired.delay(this.options.delay, this);
  },

  setValue: function(value){
    this.value = value;
    this.element.set('value', value);
    return this.clear();
  },

  onFired: function(){
    this.fireEvent('onFired', [this.value, this.element]);
  },

  clear: function(){
    clearTimeout(this.timeout || null);
    return this;
  },
  /* Clientcide change */
  pause: function(){
    clearTimeout(this.timeout);
    clearTimeout(this.timer);
    this.element.removeEvent('keyup', this.boundChange);
    return this;
  },
  resume: function(){
    this.value = this.element.get('value');
    if (this.options.periodical) this.timer = this.changed.periodical(this.options.periodical, this);
    else this.element.addEvent('keyup', this.boundChange);
    return this;
  }

});

var $equals = function(obj1, obj2){
  return (obj1 == obj2 || JSON.encode(obj1) == JSON.encode(obj2));
};