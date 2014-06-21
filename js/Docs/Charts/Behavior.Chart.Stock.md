/*
---

name: Behavior.Thanx.Chart.Stock

description: Behavior for Thanx.Chart.Stock.

requires:
 - /Thanx.Chart.Stock
 - Behavior/Behavior
 - More/Date

provides: [Behavior.Thanx.Chart.Stock]

...
*/

Behavior.addGlobalFilter('Thanx.Chart.Stock', {
  defaults: {
    exportable: true
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

    var chart = new Thanx.Chart.Stock(el, options).addEvents({
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