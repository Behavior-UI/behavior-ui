/*
---
name: Behavior.FxAccordion Tests
description: n/a
requires: [More-Behaviors/Behavior.FxAccordion, Behavior-Tests/Behavior.SpecsHelpers]
provides: [Behavior.FxAccordion.Tests]
...
*/

(function(){

	var str = 
	'<div data-behavior="Accordion" data-accordion-options="\'display\': 1, \'initialDisplayFx\': false"\
	    style="width: 300px; margin: 10px;">\
	  <div class="header" style="cursor:pointer; background: #777; padding: 2px;">Toggle 1</div>\
	  <div class="section" style="padding: 4px;">This area is controlled by Toggle 1.</div>\
	  <div class="header" style="cursor:pointer; background: #777; padding: 2px;">Toggle 2</div>\
	  <div class="section" style="padding: 4px;">This area is controlled by Toggle 2.</div>\
	  <div class="header" style="cursor:pointer; background: #777; padding: 2px;">Toggle 3</div>\
	  <div class="section" style="padding: 4px;">This area is controlled by Toggle 3.</div>\
	</div>';
	Behavior.addFilterTest({
		filterName: 'Accordion',
		desc: 'Creates an instance of Accordion',
		content: str,
		returns: Fx.Accordion,
		expect: function(element, instance){
			expect(instance.options.display).toBe(1);
			expect(element.getElements('.section')[0].getStyle('display')).toBe('block');
		}
	});
	Behavior.addFilterTest({
		filterName: 'Accordion',
		desc: 'Creates an instance of Accordion',
		content: str,
		returns: Fx.Accordion,
		multiplier: 10,
		specs: false
	});

})();