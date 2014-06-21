/*
---

name: FlatUI.FormValidator

description: Patches form Validator.Tips to show validation errors on FlatUI replacement select lists.

requires:
 - /Bootstrap.Form.Validator.Tips

provides: [FlatUI.FormValidator]

...
*/

(function(){

	var validatorFix = {
		makeAdvice: function(className, field, error, warn){
			var advice = this.previous.apply(this, arguments);
			var select = field.retrieve('select');
			if (select){
				advice.element = select.element;
				advice.show();
				select.addEvent('select', function(){
					this.validateField(field, true);
				}.bind(this));
			}
			return advice;
		},
		test: function(className, field, warn){
			var select = field.retrieve('select');
			if (select && !field.isVisible()){
				if (this.options.ignoreHidden && !select.element.isVisible()) return true;
				var styles = field.getStyles('position', 'visibility', 'display');
				field.setStyles({
					position: 'absolute',
					visibility: 'hidden',
					display: 'block'
				});
				var result = this.previous.apply(this, arguments);
				field.setStyles(styles);
				return result;
			} else {
				return this.previous.apply(this, arguments);
			}
		}
	};

	Form.Validator.Inline = Class.refactor(Form.Validator.Inline, validatorFix);
	Bootstrap.Form.Validator.Tips = Class.refactor(Bootstrap.Form.Validator.Tips, validatorFix);

})();
