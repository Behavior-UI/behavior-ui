/*
---

name: Delegator.Chart.Resize

description: Resizes a chart that's been rendered to fill its element or to a specific dimension.

requires:
 - Behavior/Delegator
 - Behavior.Chart

provides: [Delegator.Chart.Resize]

...
*/


/*
  <input data-trigger="chart.resize"
    data-chart-resize-options="
      {
        'width': 100,     //if you don't provide any values, it'll just fill the
        'height': 100,    //element it's in IF the element is visible / measurable
      }
    "
  />
*/


Delegator.register('click', {
  'chart.resize': {
    requireAs: {
      targets: String
    },
    handler: function(event, element, api){
      api.getElements('targets').each(function(chartElement){
        var chart = chartElement.retrieve('chart');
        if (chart) chart.resize(api.getAs(Number, 'width'), api.getAs(Number, 'height'));
      });
    }
  }
});
