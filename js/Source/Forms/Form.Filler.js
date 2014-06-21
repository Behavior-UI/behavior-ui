/*
---

name: Form.Filler

description: Given a set of input values, fills in the appropriate value into the appropriate inputs.

requires:
 - Core/Class.Extras
 - Core/Element.Event

provides: [Form.Filler]

...
*/


Form.Filler = new Class({

  Implements: [Options, Events],

  options: {
    // onFill: function(){},
    // allows you to override how target elements are found; by default, by ID
    getElement: function(key){
      return document.id(key);
    },
    formatters: {
      /* example formatter:
      //some-count is the id of the element and also the key for the data
      'some-count': {
        format: function(value){
          //formats the value and returns the result
          return value * (document.id('someTarget').get('value') || 0).toInt();
        }
      }
      */
    },
    // given a key and value, set the value into the element
    // by default calls .set('value', value), but, for example,
    // could easily use .set('html', value);
    setValue: function(key, value){
      this.options.getElement(key).set('value', value)
          .set('tween', {duration: 700})
          .tween('background-color', '#FFFAB3', '#ffffff');
    }
  },


  /*
    select - the selet input you want to monitor for changes
    data - a set of objects where the key for each object is the value of
           an option in the select list and the value is an object with
           key/value pairs of (typically) element ids and their corresponding value

    Example:

    <select>
      <option>bold</option>
      <option>pastel</option>
    </select>
    <input id="blue-hex"/>
    <input id="red-hex"/>

    Data would be:
    {
      "bold": {
        "blue-hex": '#0000FF',
        "red-hex":  '#FF0000'
      },
      "pastel": {
        "blue-hex": '#8493CA',
        "red-hex":  '#F7977A'
      }
    }

  */

  initialize: function(select, data, options){
    this.select = document.id(select);
    this.data = data;
    this.setOptions(options);
    this.attach();
  },

  attach: function(_method){
    _method = _method || 'addEvents';
    if (!this.bound){
      this.bound = {
        fill: this.fill.bind(this)
      };
    }
    this.select[_method]({
      change: this.bound.fill
    });
  },

  detach: function(){
    this.attach('removeEvents');
  },

  // fills all the specified inputs with provided data
  fill: function(){
    // get the data that maps to the selected item
    var data = this.data[this.select.getSelected()[0].get('value')];
    // if we found any, let's run through
    if (data){
      Object.each(data, function(value, key){
        // if there's a custom formatter for any given key,
        // use it to format the value
        var formatter = this.options.formatters[key];
        if (formatter) value = formatter.format(value);
        // set the value
        this.options.setValue.apply(this, [key, value]);
      }, this);
      this.fireEvent('fill');
    }
  }

});