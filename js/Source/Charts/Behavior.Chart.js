/*
---

name: Behavior.Chart

description: Behavior for Chart.

requires:
 - Behavior/Behavior
 - Chart

provides: [Behavior.Chart]

...
*/

(function(){

  // determines if an element is visible
  var isVisible = function(el){
    return !!(!el || el.offsetHeight || el.offsetWidth);
  };


  Behavior.addGlobalFilter('Chart', {

    defaults: {
      exportable: true
    },

    returns: Chart,

    // custom initializer to prevent charts from initializing before they are displayed
    initializer: function(element, api){
      // if the element is visible on startup, show it.
      if (isVisible(element)) return api.runSetup();
      else {
        // measure it every quarter second
        var timer = (function(){
          // if the element isn't in the DOM anymore, stop checking
          if (!document.body.contains(element)){
            clearInterval(timer);
          // if it's visible, stop the timer and show it
          } else if (isVisible(element)){
            clearInterval(timer);
            api.runSetup();
          }
        }).periodical(250);
      }
    },

    setup: function(el, api){

      var options = Object.cleanValues(
        api.getAs({
          v2Styles: Boolean,
          xAxis: Object,
          yAxis: Object,
          tooltips: Boolean,
          showTitle: Boolean,
          showSubTitle: Boolean,
          showLegend: Boolean,
          exportable: Boolean,
          showLabels: Boolean,
          showMarkers: Boolean,
          pointUrl: String,
          flagUrl: String,
          data: Object,
          url: String,
          useSpinner: Boolean,
          seriesType: String,
          columnStacking: String,
          columnGrouping: String,
          legendRowSize: Number,
          legendItemWidth: Number,
          baseHeight: Number,
          showFlagsInLegend: Boolean,
          navigatorSeriesColor: String,
          margin: Array,
          size: Object,
          sizeToElement: Boolean,
          zoomable: Boolean,
          dateFormat: String,
          plotBorderWidth: Number,
          plotBorderColor: String,
          plotBackgroundColor: String,
          stack: String,
          showTotal: Boolean,
          fetchEvery: Number,
          navigation: Object,
          colors: Array,
          minPointLength: Number
        })
      );

      if (api.get('dataElement')){
        var dataElement = api.getElement('dataElement', 'warn');
        if (dataElement){
          options = Object.merge(options, {
            data: {
              table: dataElement
            }
          });
        }
      }

      if (!options.data && !options.url) api.fail('cannot create chart without a url or a data object.');

      var chart = new Chart(el, options).addEvents({
        // when the chart is instantiated, we pass the event up to our Behavior instance
        onChartCreated: function(){
          api.fireEvent('chartCreated', [el, chart]);
        }
      }).update();
      api.onCleanup(function(){
        chart.destroy();
      });
      return chart;
    }
  });

})();
