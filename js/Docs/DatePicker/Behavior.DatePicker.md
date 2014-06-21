/*
---

name: Behavior.DatePicker

description: Behavior for instantiating a Datepicker.

requires:
	- Behavior/Behavior
	- More/Object.Extras
	- MooTools-DatePicker/Picker.Date
	- MooTools-DatePicker/Picker.Date.Range

provides: Behavior.DatePicker

...
*/

Behavior.addGlobalFilter('DatePicker', {
	defaults: {
		useFadeInOut: false,
		pickerClass: 'datepicker_minimal',
		timePicker: false,
		blockKeydown: false,
		submitTarget: null,
		columns: 1,
		draggable: false
	},
	returns: Picker.Date,
	setup: function(element, api){
		var toggles = [];
		if (api.get('toggles')) toggles = element.getElements(api.get('toggles'));
		var picker = new Picker.Date(element,
			Object.merge({
				toggle: toggles,
				onSelect: function(){
					element.fireEvent('change');
					if (api.get('submitTarget')){
						element.getElement(api.get('submitTarget')).submit();
					}
				}
			},
				Object.cleanValues(
					api.getAs({
						draggable: Boolean,
						columns: Number,
						useFadeInOut: Boolean,
						blockKeydown: Boolean,
						minDate: String,
						maxDate: String,
						format: String,
						timePicker: Boolean,
						yearPicker: Boolean,
						startView: String,
						startDay: Number,
						pickOnly: String,
						positionOffset: Object,
						pickerClass: String,
						updateAll: Boolean
					})
				)
			)
		);
		api.onCleanup(picker.detach.bind(picker));
		return picker;
	}
});

Behavior.addGlobalFilter('RangePicker', {
	defaults: {
		useFadeInOut: false,
		pickerClass: 'rangepicker_minimal',
		timePicker: false,
		blockKeydown: false,
		submitTarget: null,
		columns: 1,
		draggable: false
	},
	returns: Picker.Date,
	setup: function(element, api){
		var toggles = [];
		if (api.get('toggles')) toggles = element.getElements(api.get('toggles'));
		var picker = new Picker.Date.Range(element,
			Object.merge({
				toggle: toggles,
				onSelect: function(){
					element.fireEvent('change');
					if (api.get('submitTarget')){
						element.getElement(api.get('submitTarget')).submit();
					}
				}
			},
				Object.cleanValues(
					api.getAs({
						draggable: Boolean,
						columns: Number,
						useFadeInOut: Boolean,
						blockKeydown: Boolean,
						minDate: String,
						maxDate: String,
						format: String,
						timePicker: Boolean,
						yearPicker: Boolean,
						startView: String,
						startDay: Number,
						pickOnly: String,
						positionOffset: Object,
						pickerClass: String,
						updateAll: Boolean
					})
				)
			)
		);
		api.onCleanup(picker.detach.bind(picker));
		return picker;
	}
});