/*
---
description: When the user clicks a link with this delegator, submit the target form.
provides: [Delegator.SubmitLink]
requires: [Behavior/Delegator]
script: Delegator.SubmitLink.js
name: Delegator.SubmitLink

...
*/

(function(){

  var injectValues = function(form, data){
    var injected = new Elements();
    Object.each(data, function(value, key){
      if (typeOf(value) == 'array'){
        value.each(function(val){
          injected.push(
            new Element('input', {
              type: 'hidden',
              name: key,
              value: val
            }).inject(form)
          );
        });
      } else {
        new Element('input', {
          type: 'hidden',
          name: key,
          value: value
        }).inject(form);
      }
    });
    return injected;
  };

  Delegator.register('click', {

    'submitLink': function(event, el, api){
      var formSelector = api.get('form') || '!form';
      var form = el.getElement(formSelector);
      if (!form) api.fail('Cannot find target form: "' +formSelector+ '" for submitLink delegator.');
      var rq = form.retrieve('form.request');
      var extraData = api.getAs(Object, 'extra-data');
      var injected;
      if (extraData) injected = injectValues(form, extraData);
      if (rq) rq.send();
      else form.submit();
      if (injected) injected.destroy();
    }

  });

})();