/*
---

name: Form.Validator.Tag

description: Validates the entry is a comma separated list of space-less alpha-numeric strings allowing for underscores and dashes.

requires:
 - More/Form.Validator

provides: [Form.Validator.Tag]

...
*/

Form.Validator.add('tag', {
  errorMsg: Form.Validator.getMsg.pass('tag'),
  test: function(element){
    element.set('value', element.get('value').replace(/,( +)?$/,''));
    return Form.Validator.getValidator('IsEmpty').test(element) || (/^[a-z0-9\-\_]*$/).test(element.get('value'));
  }
});

Form.Validator.add('tags', {
  errorMsg: Form.Validator.getMsg.pass('tag'),
  test: function(element){
    element.set('value', element.get('value').replace(/,( +)?$/,''));
    return Form.Validator.getValidator('IsEmpty').test(element) || (/^[a-z0-9\-\_]+(,( +)?[a-z0-9\-\_]+)*$/).test(element.get('value'));
  }
});


Locale.define('en-US', 'FormValidator', {

  'tag': 'no spaces, only letters or numbers, underscores and dashes allowed. e.g. "foo", "bar", "foo-bar"',
  'tags': 'Comma separated list of tags: no spaces, only letters or numbers, underscores and dashes allowed. e.g. "foo, bar, foo-bar"'

});