/*
---
description: Adds an instance of Form.Validator.Inline to any form with the class .form-validator.
provides: [Behavior.FormValidator]
requires: [Behavior/Behavior, More/Form.Validator.Inline, More/Object.Extras, More/Fx.Scroll]
script: Behavior.FormValidator.js
name: Behavior.FormValidator
...
*/

Behavior.addGlobalFilter('FormValidator', {

  defaults: {
    useTitles: true,
    scrollToErrorsOnSubmit: true,
    scrollToErrorsOnBlur: false,
    scrollToErrorsOnChange: false,
    ignoreHidden: true,
    ignoreDisabled: true,
    evaluateOnSubmit: true,
    evaluateFieldsOnBlur: true,
    evaluateFieldsOnChange: true,
    serial: true,
    stopOnFailure: true
  },

  returns: Form.Validator.Inline,

  setup: function(element, api){
    //instantiate the form validator
    var validator = element.retrieve('validator');
    if (!validator){
      validator = new Form.Validator.Inline(element,
        Object.cleanValues(
          api.getAs({
            useTitles: Boolean,
            scrollToErrorsOnSubmit: Boolean,
            scrollToErrorsOnBlur: Boolean,
            scrollToErrorsOnChange: Boolean,
            ignoreHidden: Boolean,
            ignoreDisabled: Boolean,
            evaluateOnSubmit: Boolean,
            evaluateFieldsOnBlur: Boolean,
            evaluateFieldsOnChange: Boolean,
            serial: Boolean,
            stopOnFailure: Boolean
          })
        )
      );
    }
    //if the api provides a getScroller method, which should return an instance of
    //Fx.Scroll, use it instead
    if (api.getScroller){
      validator.setOptions({
        scrollToErrorsOnSubmit: false
      });
      validator.addEvent('showAdvice', function(input, advice, className){
        api.getScroller().toElement(input, ['y']);
      });
    }
    api.onCleanup(function(){
      validator.stop();
    });
    return validator;
  }

});