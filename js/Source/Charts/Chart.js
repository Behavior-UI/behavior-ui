/*
---

name: Chart

description: The base chart class for  Depends on HighCharts.

requires:
 - Core/Element.Dimensions
 - Core/Request.JSON
 - More/Date
 - More/URI
 - More/Array.Extras
 - More/Number.Format
 - More/Object.Extras
 - Bootstrap.Tooltip
 - Number

provides: [Chart]

...
*/

Chart = new Class({

  Implements: [Options, Events],

  options: {
    // show tooltips on hover
    tooltips: true,
    // display the title in the chart
    showTitle: true,
    // display the subtitle in the chart
    showSubTitle: true,

    // display the legend for the chart
    // the default here is true if there's more than one series
    // unless you explicitly set it to false
    // showLegend: false,

    // shows the point markers
    showMarkers: false,
    // shows the markers when you hover
    showMarkersOnHover: false,
    // show export controls
    exportable: false,
    // navigation config
    navigation: {},
    // show labels for points
    showLabels: false,
    // stack the series if 'normal' (by value) or 'percent'
    stack: null,
    // when stacking, show the total value
    showTotal: true,
    // the data for the chart; see HighCharts constructor
    data: null,
    // if data is at an ajax endpoint, the url for it
    // this is not used if options.data is provied
    // should return the options object for the HighChart constructor
    url: null,
    // if set, this url is opened when a point is clicked, passed the data for that point
    pointUrl: null,
    onPointClick: function(data){
      if (this.options.pointUrl){
        window.location.href = new URI(this.options.pointUrl).setData(data, true);
      }
    },
    flagUrl: null,
    // if set, this url is opened when a flag is clicked, passed the data for that point
    onFlagClick: function(flag){
      if (this.options.flagUrl){
        try {
          window.location.href = new URI(this.options.flagUrl).setData({ ids: flag.ids.join(",") }, true);
        } catch(e){
          if (console && console.warn) console.warn('Could not follow flag url as data ids are not found.', flag, e.message);
        }
      }
    },
    // show an ajax spinner for charts being updated
    useSpinner: true,
    // what kind of series type to display
    seriesType: 'spline',
    // the size of the chart
    size: {
      x: 100,
      y: 100
    },
    xAxis: {
      type: 'datetime',
      startOnTick: false,
      endOnTick: false,
      minRange: 2 * 24 * 3600000 // 2 days
    },
    // measure the target element and fill it; if true, options.size is ignored
    sizeToElement: true,
    // allow the user to zoom in on the chart data; boolean or 'x', 'y', or 'xy'
    zoomable: false,
    dateFormat: '%a - %b %d, %Y', //see MooTools Date.js docs
    // the border around the plot area
    plotBorderWidth: 1,
    plotBorderColor: '#eee',
    plotBackgroundColor: null,
    backgroundColor: null,
    absoluteLabels: true,
    fetchEvery: 0,
    colors: [
      '#4572A7',
      '#AA4643',
      '#be9491',
      '#80699B',
      '#3D96AE',
      '#DB843D',
      '#92A8CD',
      '#A47D7C',
      '#B5CA92'
    ],

    // V2 styles
    columnGrouping: 'day',
    // v2 specific options
    v2Styles: true,
    // space given at the top of the graph when the title and/or subtitle are visible
    titleSpace: 40,
    subTitleSpace: 29,
    // pixels to dedicate for each row of the legend
    legendRowSize: 33,
    // margin above and below the legend rows
    legendRowMargin: 10,
    legendBottomMargin: 10,
    // how wide to make the legend items; overflow is ellipsed
    // legendItemWidth: null, // defaults to 1/2 legendWidth
    // legendWidth: null, //defaults to 2/3 the chart width
    // height of the chart minus the legend and space for the title and the plotMarginTopBase
    baseHeight: 467,
    // base margin at the top used even if there's no title or legend
    plotMarginTopBase: 10,
    // minimum viable margin at the top of the graph; basically only used if you disable title,
    // subtitle, and legend
    plotMinMarginTop: 72,
    // include flags in the legend (allows them to be turned off)
    showFlagsInLegend: false,
    // width of the chart area that has lines and labels to left and right of series
    gutterWidth: 60,
    // minimum size for a column; defaults to 2 unless stacking is on
    minPointLength: null

    /*
      gradient example:
      plotBackgroundColor: {
        linearGradient: [0, 0, 0, 500],
        stops: [
          [0, 'rgb(255, 255, 255)'],
          [1, 'rgb(240, 240, 240)']
        ]
      }
    */
  },

  v2options: {
    // no border
    plotBorderWidth: 0,
    // default colors; should probably be set inline via palette
    colors: [
      '#00CCCE', // @turquoise
      '#2ECC71', // @emerald
      '#27AE60', // @nephritis
      '#AC69C7', // @amethyst
      '#0073BF'  // @belize-hole
    ],
    // date format for label in tooltip
    dateFormat: "%a, %b %e, %Y",
    // margins around the plot area; NOTE, the first item here is overwritten by ._setElementHeight
    margin: [30, 90, 30, 90],
    // show or not show the vertical lines
    showVerticalLines: false,
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      maxPadding: 0.25,
      labels: {
        formatter: function(){
          return (this.chart.options.yPrefix || "") + (self.options.absoluteLabels ? Math.abs(this.value) : this.value) +  (this.chart.options.ySuffix || "");
        }
      }
    }
  },
  basicChartOptions: {
    margin: [30, 90, 90, 90],
    titleSpace: 40,
    subTitleSpace: 29,
    legendBottomMargin: 45,
    baseHeight: 390
  },

  /*
    constructor
    arguments:
    element (id or DOM reference) - the element to contain the chart
    options (object, optional) - the options that differ from the defaults listed above
  */
  initialize: function(element, options){
    this.element = document.id(element);
    if (!options || options.v2Styles !== false){
      this._setV2Defaults();
      this.addEvent('chartCreated', function(){
        this._v2ChartTweaks();
        this._makeTooltips();
      }.bind(this));
    }
    this.setOptions(options);
    if (this.options.fetchEvery) this.play();
  },

  play: function(){
    if (!this.paused) return;
    this.paused = false;
    this.timer = this.refresh.periodical(this.options.fetchEvery, this);
  },

  pause: function(){
    this.paused = true;
    clearInterval(this.timer);
  },
  paused: true,

  getSizeOptions: function(){
    var size = this.options.size;
    if (this.options.sizeToElement) size = this.element.getSize();
    return size;
  },

  /*
    returns the options object for the HighCharts constructor.
    arguments:
    options (object, optional) - the options to merge with the defaults defined within this getter
  */
  getChartOptions: function(options){
    var yAxis = options && options.yAxis;
    if (this.options.v2Styles) options = this.getV2Options(options);
    var v2yAxis = options.yAxis;
    var size = this.getSizeOptions();
    var self = this;
    var chartOptions = Object.merge({
      chart: {
        renderTo: this.element,
        plotBorderWidth: this.options.plotBorderWidth,
        plotBorderColor: this.options.plotBorderColor,
        plotBackgroundColor: this.options.plotBackgroundColor,
        defaultSeriesType: this.options.seriesType,
        animation: {
          duration: 500,
          transition: Fx.Transitions.Pow.easeOut
        },
        width: size.x || 600,
        height: size.y || 400,
        zoomType: this.options.zoomable ? typeOf(this.options.zoomable) == "string" ? this.options.zoomable : 'x' : null,
        backgroundColor: this.options.backgroundColor
      },
      colors: this.options.colors,
      plotOptions: {
        series: {
          animation: {
            duration: 500,
            transition: Fx.Transitions.Pow.easeOut
          },
          point: {
            events: {
              click: function(e){
                // See below where self._flagClicked is set for why this is doing this.
                if (self._flagClicked) return;
                self.fireEvent('pointClick', [e.point]);
              }
            }
          },
          dataLabels: {
            enabled: this.options.showLabels
          },
          marker: {
            enabled: this.options.showMarkers,
            states:{
              hover: {
                enabled: this.options.showMarkersOnHover
              }
            }
          },
          stacking: this.options.stack || this.options.columnStacking //columnStacking deprecated
        },
        flags: {
          zIndex: 10,
          events: {
            click: function(event){
              // Clicking a flag also, inexplicably, fires the click on the point
              // we don't want that, so we introduce a short delay for the point click
              // where we prevent the pointClick from firing
              self._flagClicked = true;
              clearTimeout(self._flagClickedTimer);
              self._flagClickedTimer = (function(){
                self._flagClicked = false;
              }).delay(100);
              self.fireEvent('flagClick', [event.point]);
            }
          }
        }
      },
      xAxis: this.options.xAxis,
      tooltip: {
        xDateFormat: this.options.dateFormat,
        shared: true,
        crosshairs: true,
        useHTML: true,
        enabled: this.options.tooltips,
        formatter: function(){
          var value = self.options.xAxis.type == 'datetime' ? Highcharts.dateFormat(self.options.dateFormat, this.x) : this.x;
          // this loop goes through each point and makes the tooltip. the only difference
          // between this and the default is y values use the absolute value.

          if (this.points){
            this.points.each(function(point){
              value+= '<br/><span style="color: {color}">{name}:<b>{prefix}{pointy}{suffix}</b></span>'.substitute({
                color: point.series.color,
                name: point.series.name,
                prefix: point.series.tooltipOptions.valuePrefix || "",
                pointy: self.options.absoluteLabels ? Math.abs(point.y) : point.y,
                suffix: point.series.tooltipOptions.valueSuffix || ""
              });
            });
            if (self.options.showTotal && (self.options.stack || self.options.columnStacking) && this.points[0].total){
              value += '<br/><span>Total: <b>' + this.points[0].total + '</b></span>';
            }
          }
          if (this.point){
            value += '<span style="color: ' + this.point.series.color + '">';
            if (this.point.series.title) value += this.point.title + '<br/>';
            value += this.point.text + '</span>';
          }

          return value;
        }
      },
      credits: false,
      exporting: {
        enabled: this.options.exportable
      },
      printButton:{
        enabled: false
      },
      navigation: this.options.navigation,
      legend: {
        enabled: this.options.showLegend
      }
    }, options);
    if (yAxis && typeOf(yAxis) == 'array'){
      chartOptions.yAxis = yAxis.map(function(axis){
        return Object.merge(axis, v2yAxis);
      });
    }
    if (!this.options.showTitle) chartOptions.title = null;
    if (!this.options.showSubTitle) chartOptions.subtitle = null;
    if (!this.options.showYAxis && options.yAxis){
      if (typeOf(chartOptions.yAxis) == 'array'){
        chartOptions.yAxis.each(function(axis){
          axis.title = '';
        });
      } else {
        chartOptions.yAxis.title = "";
      }
    }
    return chartOptions;
  },

  getV2Options: function(options){
    var self = this;

    return Object.merge(options, {
      chart: {
        margin: this.options.margin
      },
      plotOptions: {
        column:{
          minPointLength: this.options.minPointLength || (this.options.seriesType == 'column' && !this.options.stack ? 0 : 2),
          pointPadding: 0.05,
          groupPadding: 0.05,
          borderWidth: 0,
          animation: {
            duration: 500,
            transition: Fx.Transitions.Pow.easeOut
          },
          tweakPointSize: function(pointWidth, pointPadding){
            if (pointWidth > 2.5){
              pointWidth = pointWidth.round();
              pointPadding = pointPadding.round();
              if (pointWidth + pointPadding % 2) pointWidth = pointWidth -1;
            }
            return {
              pointWidth: pointWidth,
              pointPadding: pointPadding
            };
          }
        },
        series: {
          events: {
            legendItemClick: function(){
              // when the user clicks a legend item, we gotta handle some stuff manually
              var index = this.chart.series.indexOf(this);
              var legendItem = self.element.getElement('.label-index-' + index),
                secondItem = legendItem.getElement('.second-icon');
              // if they've disabled it, the flag for visibililty hasn't been flipped by HighCharts yet
              // so this.visible is true, meaning it won't be in a second
              if (this.visible){
                // remove the checked class and remove the inline color (unique per series)
                // so it turns grey
                legendItem.removeClass('checked').setStyle('color', '');
                secondItem.setStyle('color', '');
              } else {
                // otherwise add the checked class
                legendItem.addClass('checked').setStyle('color', secondItem.get('data-color'));
                // and put the unique color back in place
                secondItem.setStyle('color', secondItem.get('data-color'));
              }
              // count how many are now visible
              var visible = this.chart.legend.allItems.map(function(item){
                return item.selected;
              }).length;
              // and then add the .single class to the tooltip if there's only one left

              var tip = this.chart.tooltip.label.div.getElement('.chart-tip');
              if (tip) tip[visible == 1 ? 'addClass' : 'removeClass']('single');
              return true;
            }
          }
        }
      },
      // title styles, location
      title: this.options.showTitle ? {
        align: 'left',
        x: 29,
        y: this.options.showSubTitle ? 20 : 35,
        useHTML: true
      } : null,
      subtitle: this.options.showTitle && this.options.showSubTitle ? {
        align: 'left',
        x: 29,
        y: 44,
        useHTML: true
      } : null,
      // xAxis styles
      xAxis: {
        gridLineColor: '#dcdcdc',
        // spaces out both the grid and the labels
        tickPixelInterval: 150,
        tickWidth: 0,
        gridLineWidth: this.options.showVerticalLines ? 1 : 0,
        lineWidth: 0,
        offset: 10,
        title: {
          margin: 10,
          style: {
            fontFamily: 'lato',
            fontSize: 14,
            color: '#666'
          }
        },
        labels: {
          useHTML: true,
          y: 17,
          // formats the vales below the grid to read "M \n SEP 5"
          formatter: function(){
            if (self.options.xAxis.type == 'datetime'){
              // parse the date
              var d = new Date(this.value);
              switch(self.grouping){
                case 'month':
                  return "<span class='axis-date'><span class='month'>" +
                          d.format("%b") + "</span><span class='sub'>" + d.format("%Y") + "</span></span>";
                case 'week':
                  return "<span class='axis-date'><span class='week'>week of</span><span class='sub'>" +
                          d.format("%b %e") + "</span></span>";
                default:
                  // format it; it gets styled by css
                  return "<span class='axis-date'><span class='day'>" + d.format("%a")[0] +
                         "</span><span class='sub'>" +  d.format("%b %e") + "</span></span>";
              }
            } else {
              return "<span class='axis-date'><span class='sub'>" +  this.value + "</span></span>";
            }
          }
        }
      },
      // yAxis styles
      yAxis: {
        gridLineColor: '#dcdcdc',
        // spaces out the grid and the left-side labels
        tickPixelInterval: 60,
        startOnTick: true,
        endOnTick: true,
        // push the labels off to the left
        labels: {
          align: 'right',
          x: -10,
          y: -6,
          style: {
            color: '#acacac'
          },
          // formats the labels into nice looking numbers
          formatter: function(){
            var label = self.options.absoluteLabels ? Math.abs(this.value) : this.value;
            if (typeOf(label) == "number"){
              if (label >= 10000) label = label.humanize(); // 11.2K
              else label = label.format(); // 5,425
            }
            return (this.chart.options.yPrefix || "") + label + (this.chart.options.ySuffix || "");
          }
        },
        // behavior-ui hack!
        tweakGridLine: function(path, index){
          // hide the very bottom line
          if (index === 0) return ["M", 0, 0, "L", 0, 0];
          // pushes grid lines 60px to the left and right
          // could turn this into a config option if we find we
          // want to tweak it on the fly
          path[1] -= self.options.gutterWidth;
          path[4] += self.options.gutterWidth;
          return path;
        }
      },
      // range selector button styles - the 1M, 2M, 3M etc. buttons
      rangeSelector: {
        buttonSpacing: 2,
        buttonTheme: {
          fill: 'none',
          stroke: '#e2e2e1',
          'stroke-width': 0,
          r: 2,
          style: {
            color: '#acacac',
            fontWeight: 'normal',
            textTransform: 'uppercase'
          },
          states: {
            hover: {
              fill: '#c9c9c9',
              stroke: '#c9c9c9',
              style: {
                color: 'white',
                cursor: 'pointer'
              }
            },
            select: {
              fill: '#acacac',
              stroke: '#acacac',
              style: {
                color: 'white'
              }
            }
          }
        }
      },
      // super duper custom tooltip styles
      tooltip: {
        // snappy please
        animation: false,
        // we'll handle our own colors in CSS please
        backgroundColor: 'rgba(0,0,0,0)',
        borderWidth: 0,
        shadow: false,
        // hide immediately
        hideDelay: 0,
        // the vertical line on the chart
        crosshairs: [{
          color: '#3f3f3f',
          width: 2
        }],
        // position our tooltip as we move the mouse around
        positioner: function(labelWidth, labelHeight, point){
          // x position of our line is the chart plotLeft + the offset of the point
          // and then we subtract half of the label's width to center it and subtract
          // 1 more to center on our 2px wide crosshair line
          var x = (point.plotX + this.chart.plotLeft - (labelWidth/2) - 1);
          // limit the position to 0 (so our label doesn't go off canvas left)
          // and on the right the chart's plotWidth, plus the plotLeft (margin) * 2 (for the right side)
          // minus our label's width
          var limitX = x.limit(0, this.chart.plotWidth + (this.chart.plotLeft*2) - labelWidth);
          // our final position
          var position = {
            x: limitX,
            y: (this.chart.plotTop - labelHeight - 9).max(0)
          };
          // if our x value is != limitX it means that we've bumped the right or left edge with the tip
          if (x !== limitX){
            // so calculate how far off our gridline is from center
            var offset = x - limitX;
            // and move our little triangle around to match it!
            this.chart.tooltip.label.div.getElement('.triangle').setStyle('margin-left', offset - 9);
          }
          return position;
        },
        // fancy formatted tooltips
        formatter: function(){
          // if we've got a date on our hands, format it

          var dateFormat;
          switch(self.grouping){
            case 'week':
              dateFormat = "Week of %b %e, %Y";
              break;
            case 'month':
              dateFormat = "%b, %Y";
              break;
            default:
              dateFormat = self.options.dateFormat;
          }
          var headline = self.options.xAxis.type == 'datetime' ? Highcharts.dateFormat(dateFormat, this.x) : this.x;

          var tipOptions = self.chart.options.tooltip;
          if (tipOptions.tooltipTitles && tipOptions.tooltipTitles[this.x]) headline = tipOptions.tooltipTitles[this.x];

          // start our HTML - yes, this method has to return HTML, not actual DOM elements. Booo.
          var tip = "<div class='chart-tip" +
                    (((this.points && this.points.length == 1) || this.point) ? " single" : "") +
                    "'><h5>" + headline + "</h5><ul class='chart-metrics'>";

          var count = 0;
          // little enclosed formatter for points so we can use it for both this.points and this.point
          var formatPoint = function(point){
            count++;
            // get the value we're going to display
            var num = point.y;
            if (point.point && point.point.tipValue !== undefined) num = point.point.tipValue;
            var value = (self.options.absoluteLabels ? Math.abs(num) : num);
            // if it's a number
            if (typeOf(value) == "number"){
              // hey, let's make it fun to read
              if (value > 9999) value = value.humanize({ decimals: 1 }); // 100.1K
              else value = value.format({decimals: value % 1 ? 2 : 0}); //1,219
            }

            var tooltipOptions = point.series.tooltipOptions;
            var suffix = tooltipOptions && point.point.tipValue === undefined ? tooltipOptions.valueSuffix || "" : "";
            var prefix = tooltipOptions && point.point.tipValue === undefined ? tooltipOptions.valuePrefix || "" : "";

            var tipBackgroundColor = point.series.color;
            // if the point includes a per-point color, use that as the background color of the tooltip
            if (point.point && point.point.options && point.point.options.color) tipBackgroundColor = point.point.options.color;

            // finish our our tip. We set an explicit background color so each item in the tip matches the color
            // of its series
            tip += "<li style='background-color: " + tipBackgroundColor + "'><span class='chart-metric'>" +
                    prefix + value + suffix + "</span>" + "<span class='chart-metric-name'>" + point.series.name + "</span></li>";
          };

          // now then, if we have this.points, we loop
          if (this.points){
            // format them
            this.points.each(formatPoint);
            // if we're showing the total
            if (self.options.showTotal && (self.options.stack || self.options.columnStacking) && this.points[0].total && count > 1){
              // throw a nother point on there
              formatPoint({
                y: this.points[0].total,
                series: {
                  color: '#555',
                  name: 'Total'
                }
              });
            }
          }
          // if we aren't dealing with points, there's just the one, so format it.
          if (this.point) formatPoint(this.point);
          return tip + "</ul><div class='triangle'></div></div>";
        }
      },
      // legendary styles
      legend: {
        verticalAlign: 'top',
        floating: true,
        align: 'left',
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadow: false,
        y: this.legendTop,
        x: 17,
        margin: 0,
        useHTML: true,
        symbolWidth: 0,
        itemWidth: this.options.legendItemWidth,
        width: this.options.legendWidth,
        labelFormatter: function(){
          // lots of HTML to get those fancy FLAT-UI component styles
          var index = this.chart.series.indexOf(this);
          // get the options for the series returned from the server
          var optSeries = Object.getFromPath(this, 'chart.options.series');
          // was there a tip on the series?
          var tip = (optSeries && optSeries[index] && optSeries[index].tip) || "";

          return '<label class="checkbox ' + (tip ? 'bs-tooltip ' : '') +
              (this.visible ? 'checked' : '')  +
              ' legend-name label-index-' + index + '" ' +
              (tip ? 'title="' + tip.replace(/"/g, "&quot;").trim() + '" ' : '') +
              'style="width: ' + self.options.legendItemWidth + 'px; ' +
              (this.visible ? 'color:' + this.color : '') +
              '">' +
              '<span class="icons"><span class="first-icon fui-checkbox-unchecked"></span>' +
              '<span class="second-icon fui-checkbox-checked" data-color="' + this.color + '" style="color: ' + this.color + '"></span></span>' +
              (this.type == 'flags' ? 'Flags' : this.name) +
              '</label>';
        }
      }
    });
  },

  // given the options for the HighChart.Chart constructor, creates one if not already created.
  makeChart: function(options){
    if (!this.chart){
      this.chart = new Highcharts.Chart(this.getChartOptions(options));
      this.element.store('chart', this);
      this.fireEvent('chartCreated');
    }
    return this.chart;
  },

  /*
    updates the chart data series
    arguments:
    data (object, optional) - the HighChart options object. Can just be {series: [...]} if chart
          already rendered

    if data argument not specified, and this.options.url is, the data is fetched from the server.
    if data argument not specified, and this.options.url is not, chart is drawn from this.options.data
  */
  update: function(data){
    if (data){
      // if the series returned is > 1 we show the legend by default.
      if (data.series && data.series.length > 1 && this.options.showLegend === undefined) this.options.showLegend = true;
      if (this.options.v2Styles) this._setHeightBasedOnLegendRows(data);

      if (data.yPrefix) this.yPrefix = data.yPrefix;

      if (!this.chart){
        if (data.thanxError){
          this.setOptions({
            showTitle: true,
            showSubTitle: true
          });
        }
        this.makeChart(data);
      } else if (this.chart.series.length === data.series.length){
        data.series.each(function(series, i){
          this.chart.series[i].setData(series.data, false);
        }, this);
        this.chart.redraw();
      } else {
        this.chart.series.invoke('destroy');
        data.series.each(function(series){
          this.chart.addSeries(series, false);
        }, this);
      }
    } else {
      if (this.options.url){
        this.refresh(this.options.url);
      } else if (this.options.data){
        this.update(this.options.data);
      }
    }
    this.fireEvent('update');
    return this;
  },

  /*
    refresh the chart
    arguments:
    url (string, optional) - the url to fetch new data from. if not specified uses the last used
      url or this.options.url
  */
  refresh: function(url){
    this.url = url || this.url || this.options.url;
    if (!this.request){
      this.request = new Request.JSON({
        link: 'cancel',
        method: 'get',
        useSpinner: this.options.useSpinner,
        spinnerTarget: this.element,
        onSuccess: this.update.bind(this)
      });
    }
    this.request.setOptions({
      url: this.url
    }).send();
    return this;
  },

  // destroy the chart
  destroy: function(){
    if (this.chart) this.chart.destroy();
  },

  /*
    PRIVATE
  */

  _v2ChartTweaks: function(){
    this._drawBackgrounds();
    this._moveXAxisTitle();
  },

  _makeTooltips: function(){
    // can't use behavior to make these; Highcharts mucks with the HTML of our label. Have to Instantiate them ourselves.
    this.element.getElements('.bs-tooltip').each(function(el){
      new Bootstrap.Tooltip(el);
    });
  },

  _moveXAxisTitle: function(){
    if (this.chart && this.chart.xAxis && this.chart.xAxis[0].axisTitle) this.chart.xAxis[0].axisTitle.attr({x: this.options.margin[3]});
  },

  _setV2Defaults: function(){
    var size = this.getSizeOptions();

    this.options.legendItemWidth = this.options.legendItemWidth || size.x * 0.3;
    this.options.legendWidth = this.options.legendWidth || (size.x * 0.6) + 10;

    // overrides for v1 options when v2 is enabled (the default)
    this.setOptions(this.v2options);
    this.setOptions(this.basicChartOptions);
    Highcharts.setOptions({
      lang: {
        // removes the "Zoom: " prefix before the rangeSelector buttons
        rangeSelectorZoom: ''
      }
    });
  },
  // sets element height based on presence of title, legend, etc.
  _setElementHeight: function(legendRows){
    // legendRows defaults to zero
    legendRows = legendRows || 0;
    // we start with a default margin
    var marginTop = this.options.plotMarginTopBase;
    // if either title or subtitle is enabled, include the space for them
    if (this.options.showTitle) marginTop += this.options.titleSpace;
    if (this.options.showSubTitle) marginTop += this.options.subTitleSpace;
    // if we're showing the legend, include the margin x2 (above and below it) and then the legendRowSize * the number of rows
    if (this.options.showLegend){
      this.legendTop = marginTop.max(this.options.plotMarginTopBase);
      marginTop += (this.options.legendRowMargin * 2) + (legendRows * this.options.legendRowSize) + this.options.legendBottomMargin;
    }
    // min viable size of margin top
    marginTop = [marginTop, this.options.plotMinMarginTop].max();
    // resize the element to the appropriate size
    this.element.setStyle('height', this.options.baseHeight + marginTop);
    // update the options, which is used elsewhere.
    this.options.margin[0] = marginTop;
  },
  // given a data set to put on the chart, compute how many rows the legend will
  // take up and then call _setElementHeight based on that count
  _setHeightBasedOnLegendRows: function(data){
    // when data comes back to us
    var legendRows;
    // if the legend is enabled
    if (this.options.showLegend){
      var legendItems = 0;
      // loop over the data series
      data.series.each(function(series){
        // if the series is flags and we aren't showing them in the legend, set that
        if (!this.options.showFlagsInLegend && series.type == 'flags' && !series.data.length){
          series.showInLegend = false;
        } else {
          // otherwise incriment the number of items in the legend
          legendItems++;
        }
      }, this);
      // compute how many items will fit in a row; the element's width - the chart's margins
      var itemsPerRow = (
          this.options.legendWidth / this.options.legendItemWidth
        ).toInt();
      legendRows = (legendItems / itemsPerRow).toInt() || 1;
    }
    this._setElementHeight(legendRows);
  },
  _drawBackgrounds: function(){
    // draw the light grey box behind the main chart
    var r = this.chart.renderer;
    r.rect(0, 0, this.chart.chartWidth, this.chart.chartHeight - this.chart.marginBottom, 0, 1).attr({
        fill: '#f7f7f7'
    }).add();
    r.rect(0, this.chart.chartHeight - this.chart.marginBottom - 1, this.chart.chartWidth, 61, 0, 1).attr({
        fill: '#eff0f0'
    }).add();

    // draw a grey plot line across the top of the graph
    if (this.options.showVerticalLines){
      var line = r.crispLine(["M", 30, this.chart.plotTop, "L", this.chart.chartWidth - 30, this.chart.plotTop], 1);
      r.path(line).attr({
        stroke: '#dcdcdc',
        'stroke-width': 1
      }).add();
    }
  }
});
