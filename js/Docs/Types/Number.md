/*
---

name: Thanx.Number

description: Extensions to the Number prototype.

requires:
 - Core/Number

provides: [Thanx.Number]

...
*/

Number.implement({
	humanize: function(options){
		options = Object.merge({
			suffixes: ['','K','M','G'],
			base: 1000,
			decimals: 2
		}, options);
		var i = 0;
		var value = this;
		while (value > options.base && i < options.suffixes.length - 1) {
				++i;
				value = Math.round((value / options.base) * 100) / 100;
		}
		return (value).format({ decimals: options.decimals }) + options.suffixes[i];
	}
});
