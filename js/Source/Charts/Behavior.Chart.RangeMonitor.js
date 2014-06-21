/*
---

name: Behavior.Chart.RangeMonitor

description: Monitor's a specified chart instance for changes in its range selection and triggers a specified delegator.

requires:
 - More/Date
 - Behavior/Behavior

provides: [Behavior.Chart.RangeMonitor]

...
*/

(function(){

  // monitor for date selection
  var setExtremes = function(e, api, element){
    // get the start/end values from the highchart event object
    var start = isNaN(e.min) ? new Date().decrement('month').getTime() : e.min,
        end = isNaN(e.max) ? new Date().getTime() : e.max,
        error = isNaN(e.min) || isNaN(e.max);

    var range = {
      start: new Date(start),
      end: new Date(end)
    };
    // if we're updating links
    if (api.get('links')){
      // get the format from the api for the date values
      var linkFormat = api.get('dateFormatForLinks');
      // create the ranges for that format; defaults to the integer value of the date
      var linkRanges = {
        start: linkFormat ? range.start.format(linkFormat) : range.start.getTime(),
        end: linkFormat ? range.end.format(linkFormat) : range.end.getTime()
      };
      // get each link and update the url with the ranges provided by the event
      api.getElements('links').each(function(link){
        link.set('href', new URI(link.get('href')).setData(linkRanges, true).toString());
      });
    }

    // if we're updating elements
    if (api.get('elements') || api.get('element')){
      var elementFormat = api.get('dateFormatForElements');
      // get the inputs as configured
      var singleElement = api.get('element');
      var elements = api.getAs(Object, 'elements');
      // we are updating a single element
      if (singleElement){
        var targets = element.getElements(singleElement);
        if (!targets.length) api.fail('Could not find targets for single element selector: ' + singleElement);
        if (error) targets.set('disabled', true);

        targets.each(function(target){
          var dateFormat = target.get('data-format') || elementFormat;
          var outputRange = range.start.format(dateFormat) +
                            api.get('singleInputDelimiter') +
                            range.end.format(dateFormat);
          if (target.get('tag') == 'input'){
            target.set('value', outputRange);
          } else {
            api.fireEvent('destroyDom', target);
            target.set('html', outputRange);
            api.fireEvent('ammendDom', target);
          }
        });
      // we are updating a pair of elements
      } else {
        Object.each(elements, function(selector, key){
          var targets = element.getElements(selector);
          // if there aren't any inputs found, fail
          if (!targets.length) api.fail('Could not find targets for element selector: ' + key + ' = ' + selector);
          if (error) targets.set('disabled', true);

          // otherwise update the value of each input using the date format
          targets.each(function(target){
            if (target.get('tag') == 'input'){
              target.set('value', range[key].format(target.get('data-format'), elementFormat));
            } else {
              api.fireEvent('destroyDom', target);
              target.set('html', range[key].format(target.get('data-format'), elementFormat));
              api.fireEvent('ammendDom', target);
            }
          });
        });
      }
    }
    // if we have delegators to fire, fire 'em
    if (api.getAs(Object, 'delegators')){
      Object.each(api.getAs(Object, 'delegators'), function(delegatorOptions, delegator){
        if (Delegator.verifyTargets(element, delegatorOptions, api)){
          api.getDelegator().trigger(delegator, element, null, true);
        }
      });
    }
  };

  Behavior.addGlobalFilter('Chart.RangeMonitor', {

    defaults: {
      // dateFormatForElements: Locale.get('Date.shortDate'),
      // dateFormatForLinks: if not defined, uses getTime(),
      inputsUpdateChart: false,
      singleInputDelimiter: ' - '
    },

    initializer: function(element, api){
      // set default date format inline here so we have access to Locale after config may be changed
      api.setDefault('dateFormatForElements', Locale.get('Date.shortDate'));
      // get the target - the chart element
      var target = api.getElement('target');

      // get the chart instance
      if (target.retrieve('chart')){
        // chart's already there, so let's run setup
        api.runSetup();
      } else {
        // otherwise we attach an event monitor to our Behavior instance and wait for it to be instantiated
        var monitor = function(el){
          // did the chart for THIS element get created?
          if (el == target){
            // then hey! let's run setup!
            api.runSetup();
            // and stop listening
            api.removeEvent('chartCreated', monitor);
          }
        };
        api.addEvent('chartCreated', monitor);
      }
    },

    setup: function(element, api){
      // get the target - the chart element
      var target = api.getElement('target');
      // get the chart instance
      var chart = target.retrieve('chart');
      // if there isn't a chart, fail
      if (!chart) api.fail('could not find chart for target element: ' + api.get('target'));

      if (api.get('inputsUpdateChart') && (api.get('elements') || api.get('element'))){
        var inputs;
        // get the start and end inputs
        if (api.get('element')){
          inputs = {
            start: element.getElements(api.get('element')).filter('input,select,textarea'),
            end: element.getElements(api.get('element')).filter('input,select,textarea')
          };
        } else {
          inputs = {
            start: element.getElements(api.getAs(Object, 'elements').start).filter('input,select,textarea'),
            end: element.getElements(api.getAs(Object, 'elements').end).filter('input,select,textarea')
          };
        }

        // if the selector returns more than one input, warn, and use the first
        if (inputs.start.length > 1 || inputs.end.length > 1){
          api.warn('warning: RangeMonitor can only monitor one input for start/end dates. Using first of those found');
        }
        inputs.start = inputs.start[0];
        inputs.end = inputs.end[0];
        // if there isn't both a start and end input, fail
        if (!inputs.start || !inputs.end) api.fail('cannot use the inputsUpdateChart option with RangeMonitor without both start and end inputs.');

        // method to update the range of the form
        var updateRange = function(){
          // get the dates entered
          var startValue, endValue;
          if (inputs.start == inputs.end){
            // we are affecting and responding to a single input
            var value = inputs.start.get('value').split(api.get('singleInputDelimiter'));
            startValue = Date.parse(value[0]).getTime();
            endValue = Date.parse(value[1]).getTime();
          } else {
            // we are affecting and responding to two inputs
            startValue = Date.parse(inputs.start.get('value')).getTime();
            endValue = Date.parse(inputs.end.get('value')).getTime();
          }
          var dates = {
            start: startValue,
            end: endValue
          };
          if (dates.end < dates.start) api.fail('Invalid date range; start date must be before end date');
          // if we couldn't parse the date, fail
          if (isNaN(dates.start) || isNaN(dates.end)) api.fail('cannot set chart date; cannot parse date entered.');
          // otherwise update the chart
          chart.chart.xAxis[0].setExtremes(dates.start, dates.end);
        };

        inputs.start.addEvent('change', updateRange);
        // don't fire the event twice if we are only using one input
        if (inputs.start != inputs.end) inputs.end.addEvent('change', updateRange);
      }


      if (chart.chart) setExtremes(chart.chart.xAxis[0].getExtremes(), api, element);
      chart.addEvent('setExtremes', function(e){
        setExtremes(e, api, element);
      });

      return chart;
    }
  });

})();