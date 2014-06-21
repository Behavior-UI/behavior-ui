/*
---

name: Behavior.Request.BindData

description: Binds an element's innerhtml to te contents of an
             ajax endpoint that is repeatedly polled for updates.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Request.BindData

provides: [Behavior.Request.BindData]

...
*/

Behavior.addGlobalFilter('Request.BindData', {

  requires: 'url',

  returns: Request.BindData,

  setup: function(element, api){
    var req = new Request.BindData(element,
      Object.cleanValues(
        api.getAs({
          elementMap: Object,
          requestOptions: Object
        })
      )
    );
    req.setOptions({
      requestOptions: {
        url: api.get('url')
      }
    });
    req.addEvents({
      beforeUpdate: function(target){
        api.fireEvent('destroyDom', target);
      },
      update: function(target){
        api.fireEvent('ammendDom', target.getParent());
      },
      error: function(key){
        api.warn('could not find element for key ' + key);
      }
    });
    req.start();
    api.onCleanup(req.stop.bind(api));
    return req;
  }
});