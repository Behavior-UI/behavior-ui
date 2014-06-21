/*
---

name: Request.BindData

description: Adds ability to rate limit all requests on a page.

requires:
 - Core/Request.JSON
 - More/Request.Periodical

provides: [Request.BindData]

...
*/

Request.BindData = new Class({

  Implements: [Options, Events],

  options: {
    // onUpdate: function(element, key, value){},
    // onBeforeUpdate: function(element, key, value){},
    // onError: function(key){},
    requestOptions: {
      delay: 1000,
      limit: 3000,
      method: 'get'
    },
    elementMap: {
      /*
        example:

        users: '#users',
        transactions: 'div.transactions',
        etc

      */
    },
    property: 'html'
  },

  initialize: function(container, options){
    this.element = document.id(container);
    this.setOptions(options);
  },

  start: function(){
    if (!this.req){
      this.req = new Request.JSON(this.options.requestOptions);
      this.req.addEvent('success', this.update.bind(this));
    }
    this.req.startTimer();
    this.req.send();
  },

  stop: function(){
    if (this.req) this.req.stopTimer();
  },

  update: function(data){
    Object.each(data, function(v, k){ this.set(k, v); }, this);
  },

  set: function(key, value){
    var element = this.getElement(key);
    if (element){
      this.fireEvent('beforeUpdate', [element, key, value]);
      element.set(this.options.property, value);
      this.fireEvent('update', [element, key, value]);
    } else {
      this.fireEvent('error', key);
    }
  },

  getElement: function(key){
    return this.element.getElement(this.options.elementMap[key] || '#' + key);
  }

});