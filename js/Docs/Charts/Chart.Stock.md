/*
---

name: Thanx.Chart.Stock

description: The base "stock" chart class for Thanx. Depends on HighStock.

requires:
 - More/Object.Extras
 - /Thanx.Chart

provides: [Thanx.Chart.Stock]

...
*/

Thanx.Chart.Stock = new Class({

	Extends: Thanx.Chart,

	options: {
		// the color of the series in the navigator; hex, rgb, or rgba
		// if not specified uses the first color in the colors array in options
		navigatorSeriesColor: null
	},

	/*
		returns the options object for the HighCharts constructor.
		arguments:
		options (object, optional) - the options to merge with the defaults defined within this getter
	*/
	getChartOptions: function(options){

		var timer, chartOptions, self = this;
		if (this.options.v2Styles){
		// HighStock calls chart.defaultSeriesType just chart.type...
			chartOptions = Object.merge(this.parent(options), {
				plotOptions: {
					series: {
						animation: {
							duration: 500,
							transition: Fx.Transitions.Pow.easeOut
						}
					}
				},
				// navigator customization
				navigator: {
					// fills area of nav scrubber that isn't displayed with a semi-opaque overlay
					maskFill: "rgba(255, 255, 255, 0.7)",
					outlineWidth: 0,
					// positioning
					margin: 90,
					height: 50,
					// thanx hack!
					thanxTweakNavigatorOptions: function(options){
						// expands the navigator so that it is as wide as the graph area above it
						options.offsetLeft = 0;
						options.offsetRight = 0;
						return options;
					},
					series: {
						lineWidth: 0,
						fillOpacity: 1
					},
					handles: {
						// custom styling for the grabbers on the side
						backgroundColor: "rgba(222,222,222, .8)",
						// only affects rifles
						borderColor: '#b6b6b7',
						// thanx hack!
						thanxTweakGrip: function(type, elem){
							// this callback is run against the grips and the rifles
							if (type == 'grip'){
								// if grip, change its size and position
								elem.attr({
									width: 18,
									height: 18,
									x: -9,
									y: 0,
									strokeWidth: 0
								});
							} else if (type == 'rifle'){
								// if it's the rifle, just translate the position a little
								elem.translate(0,1);
							}
							// fix their stupid resizing cursor choice
							elem.css({
								cursor: 'ew-resize'
							});
						}
					},
					// xAxis config for navigator
					xAxis: {
						labels: {
							y: 12,
							useHTML: true,
							// puts the labels that read "| AUG 2013"; styled w/ css
							formatter: function(){
								var format = "%b %Y";
								// if the data returned is of insufficient length, the navigator puts labels
								// not at the beginning of the month and we get labels within months, like,
								// on the 2nd and 17th and in that case, we put the date too
								if (new Date(this.value).get('date') != 1) format = "%b %e, %Y";
								return "<p class='navigator-label'>" + new Date(this.value).format(format) + "</p>"
							}
						},
						// hide grid lines
						gridLineWidth: 0
					}
				},
				// scrollbar styles
				scrollbar: {
					height: 31,
					barBackgroundColor: '#dedede',
					barBorderColor: '#dedede',
					barBorderRadius: 4,
					barBorderWidth: 1,
					buttonArrowColor: 'rgba(0,0,0,0)',
					rifleColor: '#b6b6b7',
					trackBackgroundColor: 'rgba(0,0,0,0)',
					trackBorderColor: 'rgba(0,0,0,0)',
					trackBorderWidth: 0,
					buttonBorderWidth: 0,
					buttonBackgroundColor: 'rgba(0,0,0,0)'
				},
				rangeSelector: {
					inputEnabled: false,
					selected: 0
				},
				xAxis: {
					events: {
						afterSetExtremes: function(e) {
							clearTimeout(timer);
							if (self.muteSetExtremes) return;
							timer = (function(){
								self.fireEvent('setExtremes', e);
							}).delay(200);
						}
					}
				}
			});
		} else {
			chartOptions = this.parent(options);
		}

		if (!Object.getFromPath(chartOptions, 'navigator.series')){
			chartOptions.navigator = chartOptions.navigator || {};
			chartOptions.navigator.series = {};
		}

		if (this.options.navigatorSeriesColor){
			chartOptions.navigator.series.color = this.options.navigatorSeriesColor;
		} else {
			var navColor = Object.getFromPath(options, 'navigator.series.color');
			chartOptions.navigator.series.color = navColor || this.options.colors[0];
		}
		chartOptions.navigator.series.animation = false;

		delete chartOptions.defaultSeriesType;
		if (this.options.seriesType) chartOptions.type = this.options.seriesType;

		if (chartOptions.legend && !this.options.v2Styles) {
			Object.merge(chartOptions.legend, {
				align: 'left',
				verticalAlign: 'top',
				floating: true,
				y: 35,
				x: 10,
				shadow: true,
				backgroundColor: '#ffffff'
			});
		}

		return chartOptions;
	},

	// given the options for the HighChart.Chart constructor, creates one if not already created.
	makeChart: function(options){
		if (!this.chart){
			this.chart = new Highcharts.StockChart(this.getChartOptions(options));
			this.element.store('chart', this);
			this.fireEvent('chartCreated');
		}
		return this.chart;
	},

	update: function(data){
		// set navigator color to the color of the first data series object unless the data has a value
		// for navigator.series.color OR `this.options.navigatorSeriesColor` is set.
		if (data && !Object.getFromPath(data, 'navigator.series.color') && !this.options.navigatorSeriesColor &&
		    data.series && data.series[0] && data.series[0].color){
			this.options.navigatorSeriesColor = this.options.navigatorSeriesColor || data.series[0].color;
		}
		this.parent.apply(this, arguments);
		if (data && (this.options.seriesType == 'column' || (data.series && data.series[0] && data.series[0].type == "column"))){
			if (this.options.columnGrouping == 'auto') this._enableAutoGrouping();
			else this._setGrouping(this.options.columnGrouping);
		}
		return this;
	},

	/*  PRIVATE */


	_setGrouping: function(group){
		if (this.grouping == group) return;

		this.grouping = group;
		this.muteSetExtremes = true;
		this.chart.series.each(function(series){
			if (series.name == "Navigator") return;
			series.update({
				dataGrouping: {
					force: true,
					units: [
						[group, [1]]
					]
				}
			});
		});
		this.muteSetExtremes = false;

	},

	_enableAutoGrouping: function(){
		if (!this._autoGrouping){
			this._autoGrouping = true;
			var day = 86400000,
					week = day * 7,
					month = day * 30;
			var timer;
			this.addEvent('setExtremes', function(e){
				clearTimeout(timer);
				timer = (function(){
					var diff = e.max - e.min;
					if (diff > month*3) this._setGrouping('month');
					else if (diff > week * 6) this._setGrouping('week');
					else this._setGrouping('day');
				}).delay(100, this);
			}.bind(this));
		}
	},

	_v2ChartTweaks: function(){
		this.parent.apply(this, arguments);
		this._alterNavComponents();
		if (this.options.type == 'column'){
			if (this.options.columnGrouping == 'auto') this._enableGrouping();
			else this._setGrouping(this.options.columnGrouping);
		}
	},

	_setV2Defaults: function(){
		this.basicChartOptions = {};
		this.parent.apply(this, arguments);
	},

	_alterNavComponents: function(){
		var chart = this.chart, //save myself some keystrokes
				self = this;
		// if the scroller is there (not for stock charts) nudge it up to
		// clip the round corners on top
		if (chart.scroller && chart.scroller.scrollbar){
			chart.scroller.scrollbar.attr({y: -4})
			// if the range selector is there
			if (chart.rangeSelector){
				// move those buttons down to where the navigagtor is
				chart.rangeSelector.buttons.each(function(button, i){
					// yes, we have to move each button seperately
					button.attr({
						y: chart.chartHeight - 131,
						x: 20 + (i * 35)
					})
				});
			}

			// monitor the navigator for mouse enter/leave so we can hide/show the grips and scrubber bar
			var isOverNavigator;
			chart.container.addEvent('mouseover', function(e){
				// this bit of code is basically cribbed from highchart::scroller.mouseDownHandler
				e = chart.pointer.normalize(e);
				var top = chart.scroller.top - 50,
						chartY = e.chartY,
						height = chart.scroller.height + 50,
						scrollbarHeight = chart.scroller.scrollbarHeight + 20;
				if (chartY > top && chartY < top + height + scrollbarHeight){ // we're vertically inside the navigator
					if (!isOverNavigator){
						self.fireEvent('mouseoverNavigator');
						isOverNavigator = true;
					}
				} else {
					if (isOverNavigator){
						self.fireEvent('mouseoutNavigator');
						isOverNavigator = false;
					}
				}
			});

			this.addEvents({
				mouseoutNavigator: this._hideNavComponents.bind(this),
				mouseoverNavigator: this._showNavComponents.bind(this)
			});

			this.element.addEvent('mouseleave', function(){
				this.fireEvent('mouseoutNavigator');
				isOverNavigator = false;
			}.bind(this));

			// hide the nav components on start, bake in a short delay
			// because, for some reason, the chart needs it (TA-4530).
			this._hideNavComponents.delay(100, this);
		}
	},
	// hides grips and scrubber bar
	_hideNavComponents: function(force){
		var chart = this.chart;
		if (!chart.scroller) return;
		// if the user is still dragging, don't hide controls
		if (!force && (chart.scroller.grabbedLeft || chart.scroller.grabbedRight || chart.scroller.grabbedCenter)) return;
		// hide all the various elements
		// scrollbar stuff
		chart.scroller.scrollbar.hide();
		chart.scroller.scrollbarGroup.hide();
		chart.scroller.scrollbarRifles.hide()
		// grips and whatnot
		chart.scroller.elementsToDestroy.each(function (elem) {
			elem.hide();
		});
		this.navControlsHidden = true;
	},
	// shows grips and scrubber bar
	_showNavComponents: function(){
		// see method above
		var chart = this.chart;
		if (!chart.scroller) return;
		chart.scroller.scrollbar.show();
		chart.scroller.scrollbarGroup.show();
		chart.scroller.scrollbarRifles.show()
		chart.scroller.elementsToDestroy.each(function (elem) {
			elem.show();
		});
		this.navControlsHidden = false;
	}

});
