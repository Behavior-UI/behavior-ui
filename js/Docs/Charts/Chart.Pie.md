/*
---

name: Thanx.Pie

description: The base pie chart class for Thanx. Depends on HighCharts.

requires:
 - /Thanx.Chart

provides: [Thanx.Pie]

...
*/
Thanx.Pie = new Class({

	Extends: Thanx.Chart,

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
						formatter: function() {
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