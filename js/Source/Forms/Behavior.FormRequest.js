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
    // figure out which element we're updating, spinning over
    var updateElement,
        update = api.get('update'),
        spinner = api.get('spinner');
    if (update =="self") updateElement = element;
    else updateElement = element.getElement(update);

    // placeholder for response
    var requestTarget = new Element('div');

    // spinner target
    if (spinner == "self") spinner = element;
    else if (spinner) spinner = element.getElement(spinner);
    else spinner = updateElement;

    // no update element? no worky!
    if (!updateElement) api.fail('Could not find target element for form update');
    var sentAt;
    var req = new Form.Request(element, requestTarget, {
      requestOptions: {
        spinnerTarget: spinner
      },
      resetForm: api.get('resetForm')
    }).addEvent('complete', function(){
      // when our placeholder has been updated, get it's inner HTML (i.e. the response)
      var html = requestTarget.get('html');
      // are we filtering that response?
      var elements;
      if (api.get('filter')){
        elements = new Element('div').set('html', html).getElements(api.get('filter'));
      }
      // destroy old DOM
      api.fireEvent('destroyDom', updateElement.getChildren());
      updateElement.empty();
      // did we filter? if so, insert filtered, else just update HTML
      if (elements) updateElement.adopt(elements);
      else updateElement.set('html', html);
      // apply behaviors and whatnot
      api.fireEvent('ammendDom', [updateElement, updateElement.getChildren()]);
      elements = []; //garbage collection
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
