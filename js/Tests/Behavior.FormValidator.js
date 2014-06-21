/*
---
name: Behavior.FormValidator Tests
description: n/a
requires: [More-Behaviors/Behavior.FormValidator, Behavior-Tests/Behavior.SpecsHelpers]
provides: [Behavior.FormValidator.Tests]
...
*/
(function(){

	var str = '<form data-behavior="FormValidator" data-formvalidator-options="\
		\'serial\': false\
	" data-formvalidator-ignore-hidden="false"></form>';
	Behavior.addFilterTest({
		filterName: 'FormValidator',
		desc: 'Creates an instance of FormValidator',
		content: str,
		returns: Form.Validator,
		expect: function(element, instance){
			expect(instance.options.serial).toBe(false);
			expect(instance.options.ignoreHidden).toBe(false);
		}
	});
	Behavior.addFilterTest({
		filterName: 'FormValidator',
		desc: 'Creates an instance of FormValidator (10x)',
		content: str,
		returns: Form.Validator,
		multiplier: 10,
		specs: false
	});

})();