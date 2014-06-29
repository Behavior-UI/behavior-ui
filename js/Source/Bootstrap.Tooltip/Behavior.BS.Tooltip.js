/*
---

name: Behavior.BS.Tooltip

description: Instantiates Bootstrap.Tooltip based on HTML markup.

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Bootstrap.Tooltip

provides: [Behavior.BS.Tooltip]

...
*/
(function(){
  var filter = {

    defaults: {
      location: 'above', //below, left, right
      animate: true,
      delayIn: 200,
      delayOut: 0,
      onOverflow: false,
      offset: 0,
      trigger: 'hover' //focus, manual
    },

    delayUntil: 'mouseover,focus',

    returns: Bootstrap.Tooltip,

    setup: function(el, api){
      var options = Object.cleanValues(
        api.getAs({
          onOverflow: Boolean,
          location: String,
          animate: Boolean,
          delayIn: Number,
          delayOut: Number,
          fallback: String,
          override: String,
          html: Boolean,
          trigger: String,
          inject: Object
        })
      );
      if (api.get('offset')){
        var offset;
        try {
          offset = api.getAs(Number, 'offset');
        } catch (e){
          offset = api.getAs(Object, 'offset');
        }
        if (offset === undefined) api.fail('Could not read offset value as number or string. The value was: ' + api.get('offset'));
        options.offset = offset;
      }
      if (options.inject && options.inject.target){
        options.inject.target = el.getElement(options.inject.target);
      }

      options.getContent = Function.from(api.get('content') || el.get('title'));
      var tip = new Bootstrap.Tooltip(el, options);
      api.onCleanup(tip.destroy.bind(tip));
      if (api.event && ((api.event.type == 'mouseover' && api.get('trigger') == 'hover') || (api.event.type == api.get('trigger')))){
        tip.show();
      } else if (api.get('showNow')){
        var showTimer,
            show = function(){
          var size = el.getSize();
          if (size.y > 0 || size.x > 0){
            tip.show();
            clearInterval(showTimer);
          }
        };
        showTimer = show.periodical(1000);
        show();
      }
      return tip;
    }
  };
  Behavior.addGlobalFilters({
    'BS.Tooltip': filter,
    'BS.Twipsy': filter // deprecated
  });
  Behavior.addGlobalFilters({
    'BS.Tooltip.Static': Object.merge({}, filter, {
      delayUntil: null,
      defaults: {
        showNow: true,
        trigger: 'manual'
      }
    })
  });
})();