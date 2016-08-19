/*
---

name: Form.Filter

description: Filters a DOM element as the user types.

requires:
 - Core/Class.Extras
 - Core/Element.Event
 - More/String.Extras

provides: [Form.Filter]

...
*/

Form.Filter = new Class({

  Implements: [Options, Events],

  options: {
    items: '+ul li',
    text: 'a',
    hideClass: 'hide',
    rateLimit: 200,
    elementProperty: 'html'
  },

  initialize: function(element, options){
    this.element = document.id(element);
    this.setOptions(options);
    this.bound = {
      filter: this.filter.bind(this)
    };
    this.attach();
  },

  attach: function(_detach){
    var method = _detach ? 'removeEvents' : 'addEvents';
    this.element[method]({
      keyup: this.bound.filter
    });
    return this;
  },

  detach: function(){
    return this.attach(true);
  },

  filter: function(){
    clearTimeout(this.timer);
    this.timer = this._filter.delay(this.options.rateLimit, this);
  },

  _filter: function(){
    var value = this.element.get('value');
    var elements = this.element.getElements(this.options.items)
    if (!value){
      elements.removeClass(this.options.hideClass);
    } else {
      elements.each(function(item){
        var text = item;
        if (this.options.text) text = item.getElement(this.options.text);
        if (!text){
          item.addClass(this.options.hideClass);
          return;
        }
        var string = text.get('html');
        if (this.options.stripTags) string = string.stripTags();
        if (string.test(value, 'i')) item.removeClass(this.options.hideClass);
        else item.addClass(this.options.hideClass);
      }, this);
    }
  }
});
