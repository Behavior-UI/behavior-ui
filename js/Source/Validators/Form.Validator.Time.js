/*
---

name: Form.Validator.Time

description: Validates that the user inputs a time before or after a relative time

requires:
 - More/Form.Validator

provides: [Form.Validator.Time]

...
*/

(function(){

	// test an input to see if it's valid
	var test = function(element, operand, offset){
		// if empty, skip
		if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
		// if not a date, error
		if (Date.parse(element.get('value')) == 'invalid date') return false;

		// get the value and parse it into a date
		var value = Date.parse(element.get('value'));
		// get the time that the thing should be greater than or less than
		var offsetTime = new Date().increment('second', offset);
		// compare
		return (operand == "after" && value > offsetTime) ||
					 (operand == "before" && value < offsetTime);
	};

	// makes a friendly string for validation message
	var friendlyTimeDiff = function(sec){
		// is the time we're comparing in the past or future?
		var suffix = sec > 0 ? " from now" : " ago";
		// turn the offset into words, e.g. 1 hour, 5 minutes, 12 seconds
		sec = sec.abs();
		var msg = [];
		['year', 'month', 'day', 'hour', 'minute', 'second'].each(function(unit){
			// convert the unit into seconds
			var unitInSec = Date.units[unit]() / 1000;
			if (sec > unitInSec){
				var count = (sec / (unitInSec)).toInt()
				// push the time value  into our array
				msg.push(count + " " + unit + (count > 1 ? "s" : ""));
				// update the remainder
				sec = sec - ((unitInSec) * count);
			}
		});
		// join the time with the suffix (from now / ago)
		return msg.join(", ") + suffix;
	};

	// gets the friendly time and injects it into the time offset string
	var timeMsg = function(element, msg, offset){
		return Form.Validator.getMsg('time-offset').substitute({when: msg, amount: friendlyTimeDiff(offset)});
	};

	Form.Validator.addAllThese([

		// validates that the time is before a given offset; i.e. that it's
		// before an hour from now, or an hour ago
		['validate-time-before', {
			errorMsg: function(element, props){
				return timeMsg(element, 'before', props.offsetBefore, props);
			},
			test: function(element, props){
				return test(element, 'before', props.offsetBefore);
			}
		}],

		// validates that the time is after a given offset; i.e. that it's
		// after an hour from now, or an hour ago
		['validate-time-after', {
			errorMsg: function(element, props){
				return timeMsg(element, 'after', props.offsetAfter, props);
			},
			test: function(element, props){
				return test(element, 'after', props.offsetAfter);
			}
		}]

	]);

})();

Locale.define('en-US', 'FormValidator', {
  'time-offset':  'Please enter a time {when} {amount}.'
});
