/*
---

name: Form.Validator.Range

description: Provides min and max validators (for validating integers).

requires:
 - More/Form.Validator

provides: [Form.Validator.Range]

...
*/

Form.Validator.addAllThese([

  ['min', {
    errorMsg: function(element, props){
      if (isNaN(element.get('value').toInt())) return Form.Validator.getMsg.pass('numeric');

      if (typeOf(props.min) != 'null'){
        return Form.Validator.getMsg('min').substitute({min: props.min});
      } else {
        return '';
      }
    },
    test: function(element, props){
      if (Form.Validator.getValidator('IsEmpty').test(element)) return true;

      if (typeOf(props.min) != 'null'){
        var value = element.get('value').toInt()
        if (isNaN(value)) return false;

        return value >= props.min;
      } else {
        return true;
      }
    }
  }],
  ['max', {
    errorMsg: function(element, props){
      if (isNaN(element.get('value').toInt())) return Form.Validator.getMsg.pass('numeric');

      if (typeOf(props.max) != 'null'){
        return Form.Validator.getMsg('max').substitute({max: props.max});
      } else {
        return '';
      }
    },
    test: function(element, props){
      if (Form.Validator.getValidator('IsEmpty').test(element)) return true;

      if (typeOf(props.max) != 'null'){
        var value = element.get('value').toInt()
        if (isNaN(value)) return false;

        return value <= props.max;
      } else {
        return true;
      }
    }
  }]
]);

Locale.define('en-US', 'FormValidator', {
  'min':   'Please enter a number greater at least {min}.',
  'max':   'Please enter a number no greater than {max}.'
});