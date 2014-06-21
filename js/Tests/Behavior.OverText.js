/*
---
name: Behavior.OverText Tests
description: n/a
requires: [More-Behaviors/Behavior.OverText, Behavior-Tests/Behavior.SpecsHelpers]
provides: [Behavior.OverText.Tests]
...
*/

(function(){

	var str = '<input data-behavior="OverText" title="test"/>';
	Behavior.addFilterTest({
		filterName: 'OverText',
		desc: 'Creates an instance of OverText',
		content: str,
		returns: OverText
	});
	Behavior.addFilterTest({
		filterName: 'OverText',
		desc: 'Creates an instance of OverText',
		content: str,
		returns: OverText,
		multiplier: 10,
		specs: false
	});

})();