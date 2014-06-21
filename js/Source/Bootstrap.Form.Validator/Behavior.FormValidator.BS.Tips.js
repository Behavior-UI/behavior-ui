/*
---
name: Behavior.FormValidator.BS.Tips

description: Instantiates an instance of Bootstrap.Form.Validator.Tips

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Bootstrap.Form.Validator.Tips

provides: [Behavior.FormValidator.BS.Tips]
...
*/

Behavior.addGlobalFilter('FormValidator.BS.Tips', {
  defaults: {
    scrollToErrorsOnSubmit: true,
    scrollToErrorsOnBlur: false,
    scrollToErrorsOnChange: false,
    ignoreHidden: true,
    ignoreDisabled: true,
    useTitles: false,
    evaluateOnSubmit: true,
    evaluateFieldsOnBlur: true,
    evaluateFieldsOnChange: true,
    serial: true,
    stopOnFailure: true,
    errorPrefix: '',
    warningPrefix: ''
  },
  setup: function(element, api){
    //instantiate the form validator
    var validator = element.retrieve('validator');
    if (!validator){

      var options = Object.cleanValues(
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
          stopOnFailure: Boolean,
          warningPrefix: String,
          errorPrefix: String,
          tooltipOptions: Object,
          extraClass: String
        })
      );

      if (options.tooltipOptions && options.tooltipOptions.inject && options.tooltipOptions.inject.target){
        options.tooltipOptions.inject.target = element.getElement(options.tooltipOptions.inject.target);
      }

      validator = new Bootstrap.Form.Validator.Tips(element, options);
    }
    //if the api provides a getScroller method, which should return an instance of
    //Fx.Scroll, use it instead
    if ((
        api.get('scrollToErrorsOnSubmit') ||
        api.get('scrollToErrorsOnBlur') ||
        api.get('scrollToErrorsOnChange')
      ) && api.getScroller){
      validator.setOptions({
        scrollToErrorsOnSubmit: false
      });
      validator.addEvent('showAdvice', function(input){
        api.getScroller().toElement(input, ['y']).chain(function(){
          validator.advices.each(function(a){
            if (a.visible) a.show(); //reposition the tooltip after we scroll
          });
        });
      });
    }
    api.onCleanup(function(){
      validator.stop();
    });
    return validator;
  }

});