/*
---

name: Behavior.InfiniteScroll

description: Simplification of BS.Affix that fires AJAX delegator when scrolling to Affix element.

license: MIT-style license.

authors: [Aaron Newton, Davy Wentworth]

requires:
 - Behavior/Behavior
 - Bootstrap.Affix

provides: [Behavior.InfiniteScroll]

...
*/

Behavior.addGlobalFilters({
  'InfiniteScroll': {

    requires: ['top'],

    returns: Bootstrap.Affix,

    setup: function(el, api){
      var options = Object.cleanValues(
        api.getAs({
          classNames: Object,
          ajaxElement: String,
          ajaxElementOffset: Number
        })
      );

      options.monitor = api.get('monitor') ? api.getElement('monitor') : window;

      options.affixAtElement = {
        'top': {
          'element': options.ajaxElement,
          'offset': options.ajaxElementOffset
        }
      };

      var topEl = options.affixAtElement.top.element;
      options.affixAtElement.top.element = topEl == 'self' ? el : el.getElement(topEl);
      if (!options.affixAtElement.top.element) api.warn('could not find ajaxElement!', topEl, el);

      options.onPin = function(){
        var topElement = options.affixAtElement.top.element;
        if (topElement){
          api.getDelegator().trigger('Ajax', topElement);
        }
      };

      var affix = new Bootstrap.Affix(el, options);

      var refresh = affix.refresh.bind(affix),
          events = {
            'layout:display': refresh,
            'ammendDom': refresh,
            'destroyDom': refresh
          };

      api.addEvents(events);
      window.addEvent('load', refresh);
      api.addEvent('apply:once', refresh);

      api.onCleanup(function(){
        affix.detach();
        api.removeEvents(events);
      });

      return affix;
    }
  }
});
