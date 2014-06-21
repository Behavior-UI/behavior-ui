/*
---
name: Behavior.FormRequest Tests
description: n/a
requires: [More-Behaviors/Behavior.FormRequest, Behavior-Tests/Behavior.SpecsHelpers]
provides: [Behavior.FormRequest.Tests]
...
*/
(function(){

	var str = 
	'<form data-behavior="FormRequest" data-formrequest-options="\'update\': \'+.#formRequestTest\'"></form>\
	 <div id="formRequestTest"></div>';
	Behavior.addFilterTest({
		filterName: 'FormRequest',
		desc: 'Creates an instance of FormRequest',
		content: str,
		returns: Form.Request,
		expect: function(element, instance){
			expect(instance.target.id).toBe('formRequestTest');
		}
	});
	Behavior.addFilterTest({
		filterName: 'FormRequest',
		desc: 'Creates an instance of FormRequest (10x)',
		content: str,
		returns: Form.Request,
		multiplier: 10,
		specs: false
	});

})();