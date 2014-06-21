/*
---

name: Behavior.Chart.ShowPopup

description: Enables charts to show a popup.

requires:
 - Behavior.Chart

provides: [Behavior.Chart.ShowPopup]

...
*/
(function(){
  var getPlugin = function(prefix){
    return {
      setup: function(el, api, instance){
        // get the options from the showPopup delegator instead of our plugin
        var instanceApi = new BehaviorAPI(el, prefix);
        var selector = instanceApi.get('showPopup');
        if (selector){
          // when the user clicks a point
          instance.addEvent('pointClick', function(data){
            // get teh target; can't use instanceApi.getElement because it didn't come from our Behavior instance
            var target = el.getElement(selector);
            if (!target) api.fail('Could not find popup target for selector: ', selector);
            // get the popup and show it.
            target.getBehaviorResult('BS.Popup').show();
            // if we're mapping the point's date to an input in the popup
            var mapConfig = instanceApi.get('mapDateToInput');
            if (mapConfig && mapConfig.target){
              // get the target input
              var input = target.getElement('[name=' + mapConfig.target + ']');
              if (!input) api.fail('Could not find date input for [name=' + mapConfig.target + ']');
              // and then set the date
              input.set('value', new Date(data.x).format(mapConfig.format || '%m/%d/%Y'));
            }
          });
        }
      }
    };
  };

  Behavior.addGlobalPlugin('Chart', 'Chart.ShowPopup', getPlugin('Chart'));
  Behavior.addGlobalPlugin('Chart.Stock', 'Chart.Stock.ShowPopup', getPlugin('Chart.Stock'));

})();
