/*
---

name: Form.Validator.NumbersOnly

description: Validates the entry is only numbers (no punctuation, can lead with 0)

requires:
 - More/Form.Validator

provides: [Form.Validator.NumbersOnly]

...
*/


Form.Validator.add('numbers-only', {
  errorMsg: Form.Validator.getMsg.pass('numbers-only'),
  test: function(element){
    return Form.Validator.getValidator('IsEmpty').test(element) || (/^(\d*)$/).test(element.get('value'));
  }
});


Locale.define('en-US', 'FormValidator', {

  'numbers-only': 'Please enter numbers only.'

});

