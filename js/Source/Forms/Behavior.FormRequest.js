/*
---
description: Makes form elements with a FormRequest data filter automatically update via Ajax.
provides: [Behavior.FormRequest]
requires: [Behavior/Behavior, More/Form.Request]
script: Behavior.FormRequest.js
name: Behavior.FormRequest
...
*/

Behavior.addGlobalFilter('FormRequest', {

  defaults: {
    resetForm: true
  },

  returns: Form.Request,

  setup: function(element, api){
    var updateElement,
        update = api.get('update'),
        spinner = api.get('spinner');
    if (update =="self") updateElement = element;
    else updateElement = element.getElement(update);

    if (spinner == "self") spinner = element;
    else if (spinner) spinner = element.getElement(spinner);
    else spinner = updateElement;

    if (!updateElement) api.fail('Could not find target element for form update');
    var sentAt;
    var req = new Form.Request(element, updateElement, {
      requestOptions: {
        filter: api.get('filter'),
        spinnerTarget: spinner
      },
      resetForm: api.get('resetForm')
    }).addEvent('complete', function(){
      api.applyFilters(updateElement);
    }).addEvent('send', function(){
      sentAt = new Date().getTime();
    });
    // this bit below is to throttle form submission in case more than one thing
    // is trying to send it

    // remove form.request submit watcher
    element.removeEvent('submit', req.onSubmit);
    // our new submit handler checks that requests to submit are at least 200ms apart
    var submit = function(e){
      if (!sentAt || sentAt + 200 < new Date().getTime()){
        req.onSubmit(e);
      } else {
        // if they aren't, just stop the submit event if it's present
        if (e) e.stop();
      }
    };
    // now monitor submit with our new method
    element.addEvent('submit', submit);
    // and overwrite the submit method on the element
    element.submit = submit;
    api.onCleanup(function(){
      req.detach();
      delete element.submit;
    });
    return req;
  }

});
