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
    defaults: {
      failQuietly: false
    },
    requireAs: {
      targets: String
    },
    handler: function(event, element, api){
      var targets = element.getElements(api.get('targets'));
      if (targets.length == 0 && !api.getAs(Boolean, 'failQuietly')){
        api.fail('Could not find chart.resize target: ' + api.get('targets'));
      }
      targets.each(function(chartElement){
        var chart = chartElement.retrieve('chart');
        if (chart) chart.resize(api.getAs(Number, 'width'), api.getAs(Number, 'height'));
      });
    }
  }
});
