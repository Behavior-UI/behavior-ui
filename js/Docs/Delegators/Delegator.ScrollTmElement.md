/*
---

name: Delegator.ScrollToElement

description: Scrolls the window (or another element) to a target element

requires:
 - Behavior/Delegator
 - More/Fx.Scroll

provides: [Delegator.ScrollToElement]

...
*/
(function(){

  Delegator.register('click', 'scrollToElement', {
    defaults: {
      target: 'window',
      scrollMethod: 'toElement' //alternates: toElementEdge, toElementCenter
    },
    handler: function(event, element, api){
      var fx = element.retrieve('scrollToElement');
      if (!fx){
        var target = api.get('target') ? api.getElement('target') : element;
        fx = new Fx.Scroll(target,
          Object.cleanValues({
            offset: api.getAs(Object, 'offset'),
            duration: api.getAs(Number, 'duration'),
            transition: api.get('transition')
          })
        );
        element.store('scrollToElement', fx);
      }
      var toElement;
      if (api.get('toElement')) toElement = api.getElement('toElement');
      else toElement = document.body.getElement(element.get('href')); // allows for simple #name links
      if (!toElement) api.fail('Could not scroll to element ', api.get('toElement') || element.get('href'));
      event.preventDefault();
      fx[api.get('scrollMethod')](toElement, api.get('axes'), api.get('offset'));
    }

  });

})();