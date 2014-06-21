/*
---

name: Form.Validator.NoSpaces

description: A url validator that does not allow spaces

requires:
 - More/Form.Validator

provides: [Form.Validator.NoSpaces]

...
*/



Form.Validator.add('no-spaces', {
  errorMsg: Form.Validator.getMsg.pass('no-spaces'),
  test: function(element){
    // remove leading and trailing whitespace
    element.set('value', element.get('value').trim());
    return Form.Validator.getValidator('IsEmpty').test(element) || !(/\s/).test(element.get('value'));
  }
});

Locale.define('en-US', 'FormValidator', {

  'no-spaces': 'No spaces, tabs, or line breaks are allowed in this field.'

});