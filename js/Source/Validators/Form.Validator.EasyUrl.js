/*
---

name: Form.Validator.EasyUrl

description: A url validator that adds the http:// for the user

requires:
 - More/Form.Validator

provides: [Form.Validator.EasyUrl]

...
*/

Form.Validator.add('easy-url', {
  errorMsg: Form.Validator.getMsg.pass('url'),
  test: function(element){
    if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
    if (!(/^(https?|ftp|rmtp|mms)/).test(element.get('value'))) element.set('value', 'http://' + element.get('value'));
    return Form.Validator.getValidator('validate-url').test(element);
  }
});