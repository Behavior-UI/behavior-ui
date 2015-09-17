/*
---

name: Form.Validator.Zip

description: Validates the entry is a 5 digit zip code (numerals only)

requires:
 - More/Form.Validator

provides: [Form.Validator.Zip]

...
*/

Form.Validator.add('zip', {
  errorMsg: Form.Validator.getMsg.pass('zip'),
  test: function(element){
    return Form.Validator.getValidator('IsEmpty').test(element) || (/^(\d{5})?$/).test(element.get('value'));
  }
});


Locale.define('en-US', 'FormValidator', {

  'zip': 'Please enter a 5 digit zip code.'

});

