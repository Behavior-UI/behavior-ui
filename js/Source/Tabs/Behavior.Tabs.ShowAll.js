
/*
---

name: Behavior.Tabs.ShowAll

description: Adds support for a "show all" button for the tabs UI

license: MIT-style license.

authors: [Aaron Newton]

requires:
 - Behavior.BS.Tabs

provides: [Behavior.Tabs.ShowAll]

...
*/
(function(){
  var getFilter = function(prefix){
    return {
      setup: function(el, api, instance){
        var instanceApi = new BehaviorAPI(el, prefix);
        var showAll = instanceApi.get('showAllSelector');
        if (showAll){
          var elements = el.getElements(showAll);
          if (elements.length == 0){
            api.warn('Cannot attach to "show all" buttons as none were found with this selector: ', showAll)
          } else {
            elements.addEvent('click', function(e){
              instance.sections.each(function(el){
                el.setStyle('display', 'block');
              });
              if (instance.now !== null){
                var tab = instance.tabs[instance.now];
                tab.removeClass('active');
                parentTab = tab.getElement('!.active');
                if (el.hasChild(parentTab)) parentTab.removeClass('active');
              }
              instance.now = null;
              elements.addClass('active');
            });
          }
        }
      }
    };
  };

  Behavior.addGlobalPlugin('Tabs', 'Behavior.Tabs.ShowAll', getFilter('Tabs'));
  Behavior.addGlobalPlugin('BS.Tabs', 'Behavior.BS.Tabs.ShowAll', getFilter('BS.Tabs'));
})();