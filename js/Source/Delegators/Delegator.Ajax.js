/*
---
description: Provides functionality for links that load content into a target element via ajax.
provides: [Delegator.Ajax]
requires: [Behavior/Delegator, Core/Request.HTML, More/Spinner, More/Object.Extras]
script: Delegator.Ajax.js
name: Delegator.Ajax
...
*/
(function(){
  var send = function(event, link, api){
    if (api.getAs(Boolean, 'loadOnce') === true && link.retrieve('ajaxLoaded')){
      api.warn('already loaded link via ajax. `once` option is true, so exiting quietly.', api.get('href') || link.get('href'));
      return;
    }
    var target,
      action = api.get('action'),
      selector = api.get('target');
    if (selector){
      if (selector == "self"){
        target = link;
      } else {
        target = link.getElement(selector);
      }
    }

    if (!target) api.fail('ajax trigger error: element matching selector %s was not found', selector);

    var requestTarget = new Element('div');

    var spinnerTarget = api.get('spinnerTarget') || api.get('spinner-target'); //spinner-target is deprecated
    if (spinnerTarget) spinnerTarget = link.getElement(spinnerTarget);

    var request = link.retrieve('Delegator.Ajax.Request');
    if (!request){
      request = new Request.HTML();
      link.store('Delegator.Ajax.Request', request);
    }
    request.removeEvents('success');
    request.setOptions(
      Object.cleanValues({
        method: api.get('method'),
        evalScripts: api.get('evalScripts'),
        url: api.get('href') || link.get('href'),
        spinnerTarget: spinnerTarget || target,
        useSpinner: api.getAs(Boolean, 'useSpinner'),
        update: requestTarget,
        onSuccess: function(){
          //reverse the elements and inject them
          //reversal is required since it injects each after the target
          //pushing down the previously added element
          var elements = requestTarget.getChildren();
          if (api.get('filter')){
            elements = new Element('div').adopt(elements).getElements(api.get('filter'));
          }
          switch(action){
            case 'ignore':
              break;
            case 'replace':
              var container = target.getParent();
              elements.reverse().inject(target , 'after');
              api.fireEvent('destroyDom', target);
              target.destroy();
              api.fireEvent('ammendDom', [container, elements]);
              break;
            case 'update':
              api.fireEvent('destroyDom', target.getChildren());
              target.empty();
              elements.inject(target);
              api.fireEvent('ammendDom', [target, elements]);
              break;
            default:
              //injectTop, injectBottom, injectBefore, injectAfter
              var where = action.replace('inject', '').toLowerCase();
              if (where == 'top' || where == 'after') elements.reverse();
              elements.inject(target, where);
              api.fireEvent('ammendDom', [target, elements]);
          }
          if (api.get('updateHistory')){
            api.fireEvent('updateHistory', api.get('historyURI') || api.get('href') || link.get('href'));
          }
          elements = []; //garbage collection
        },
        onFailure: function(e){
          if (api.get('errorRedirectURL')){
            window.location.href = api.get('errorRedirectURL');
          }
        }
      })
    );

    // allow for additional data to be encoded into the request at the time of invocation
    var data;
    // if the encode option is set
    if (api.get('encode')){
      // go get the element to encode; allow 'self' or a selector
      var encode = api.get('encode') == 'self' ? link : link.getElement(api.get('encode'));
      // if one was found, encode it!
      if (encode){
        data = {};
        // if the reference is a single input, just capture its value
        if (encode.get('tag') == 'input') data[encode.get('name')] = encode.get('value');
        // else encode the element's children as a query string
        else data = encode.toQueryString();
      } else {
        api.warn("Warning: Ajax delegator could not find encode target " + api.get('encode'));
      }
    }
    if (data) request.send({data: data});
    else request.send();
    link.store('ajaxLoaded', true);
  };

  Delegator.register('click', 'ajax', {
    require: ['target'],
    defaults: {
      action: 'injectBottom',
      method: 'get',
      throttle: 0 //prevents sending repeatedly within this threshold
    },
    handler: function(event, link, api){
      event.preventDefault();
      // if the throttle is set and != 0
      if (api.get('throttle')){
        // store the timer on the element for subsequent requests
        var timer = link.retrieve('ajaxTimer');
        // clear the previous running timer if there is one
        if (timer) clearTimeout(timer);
        // store the new one; delaying the send call by the configured amount
        link.store('ajaxTimer', send.delay(api.getAs(Number, 'throttle'), this, arguments));
      } else {
        // otherwise hey, no throttle. send it.
        send.apply(this, arguments);
      }
    }
  });

  // legacy

  Delegator.cloneTrigger('ajax', 'Ajax');

})();
