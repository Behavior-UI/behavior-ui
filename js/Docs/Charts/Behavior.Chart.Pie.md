/*
---

name: Behavior.Chart.Pie

description: Behavior for Chart.Pie.

requires:
 - /Chart.Pie
 - Behavior/Behavior

provides: [Behavior.Chart.Pie]

...
*/

Behavior.addGlobalFilter('Chart.Pie', {
	defaults: {
		v2Styles: false
	},
	setup: function(el, api){

		if (!api.getAs(Object, 'data') && !api.getAs(String, 'url')) api.fail('cannot create chart without a url or a data object.');

		var chart = new Thanx.Pie(el,
			Object.cleanValues(api.getAs({
				v2Styles: Boolean,
				showTitle: Boolean,
				showSubTitle: Boolean,
				showLegend: Boolean,
				exportable: Boolean,
				showLables: Boolean,
				data: Object,
				url: String,
				useSpinner: Boolean,
				seriesType: String,
				size: Object,
				sizeToElement: Boolean,
				zoomable: Boolean,
				maxZoom: Number,
				dateFormat: String,
				plotBorderWidth: Number,
				plotBorderColor: String,
				plotBackgroundColor: String,
				backgroundColor: String,
				tooltips: Boolean
			}))
		).addEvents({
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