/*
---

name: Number

description: Extensions to the Number prototype.

requires:
 - Core/Number

provides: [Number]

...
*/

Number.implement({
  humanize: function(options){
    options = Object.merge({
      suffixes: ['','K','M','G'],
      base: 1000,
      decimals: 2,
      decimalsLessThanBase: true // by default, we show decimals for numbers less than the base amount.
                                 // eg., 945 becomes 945.00 if decimals == 2
                                 // setting this to false just returns 945
    }, options);
    var i = 0;
    var value = this;
    if (!options.decimalsLessThanBase && value < options.base) return value;
    while (value > options.base && i < options.suffixes.length - 1){
        ++i;
        value = Math.round((value / options.base) * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals);
    }
    return (value).format({ decimals: options.decimals }) + options.suffixes[i];
  },

  operate: function(operator, modifier){
    switch(operator){
      case '+':
        return this+modifier;
        break;
      case '-':
        return this-modifier;
        break;
      case '*':
        return this*modifier;
        break;
      case '/':
        return this/modifier;
        break;
      default:
        try{
          return this[operator](modifier);
        } catch (e){
          throw "Unknown operator for Number.operate: "+operator
        }
    }
  }
});
