/*
---

name: Chart.Pie

description: The base pie chart class for Behavior-UI. Depends on HighCharts.

requires:
 - Chart

provides: [Chart.Pie]

...
*/
Chart.Pie = new Class({

  Extends: Chart,

  options: {
    seriesType: 'pie'
  },

  getChartOptions: function(options){
    var opt = Object.merge(this.parent(options), {
      plotOptions: {
        pie: {
          dataLabels: {
            enabled: this.options.showLabels,
            color: '#000000',
            connectorColor: '#000000',
            formatter: function(){
              return '<b>'+ this.point.name +'</b>: '+ this.percentage +' %';
            }
          }
        }
      },
      tooltip: {
        shared: false
      }
    });
    return opt;
  }

});