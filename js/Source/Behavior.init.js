/*
---

name: Behavior.init

description: Generic startup file for pages that use behavior and delegator for their js invocation.

requires:
 - Behavior/Behavior
 - Behavior/Delegator
 - Core/DomReady

provides: [Behavior.init]

...
*/

window.addEvent('domready', function(){
	window.behavior = new Behavior({
	  verbose: window.location.search.indexOf('verbose=true') >= 0 ||
	           window.location.search.indexOf('debug=true') >= 0,
	  breakOnErrors: window.location.search.indexOf('breakOnErrors=true') >= 0 ||
	           window.location.search.indexOf('debug=true') >= 0,
	});
	window.delegator = new Delegator({
	  getBehavior: function(){ return behavior; }
	}).attach(document.body);
	behavior.setDelegator(delegator).apply(document.body);
});
