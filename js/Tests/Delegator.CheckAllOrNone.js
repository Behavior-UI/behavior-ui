/*
---
name: Delegator.CheckAllOrNone Tests
description: n/a
requires: [More-Behaviors/Delegator.CheckAllOrNone]
provides: [Delegator.CheckAllOrNone.Tests]
...
*/


(function(){
	var dom = new Element('div', {'class':'chex'}).set('html',
		'<a id="all" data-trigger="checkAll" data-checkall-targets ="!div.chex input">checkAll</a>\
		 <a id="none" data-trigger="checkNone" data-checknone-targets="!div.chex input">checkNone</a></p>\
		 <hr/>\
		 <input type="checkbox"/>\
		 <input type="checkbox"/>\
		 <input type="checkbox"/>\
		 <input type="checkbox"/>\
		 <input type="checkbox"/>');
	var del = new Delegator().attach(dom),
	    all = dom.getElement('#all'),
	    none = dom.getElement('#none');
	describe('Delegator.CheckAllOrNone', function(){
		it('should check all the inputs', function(){
			del.trigger('checkAll', all, 'click');
			expect(dom.getElements('input').get('checked')).toEqual([true, true, true, true, true]);
		});
		it('should uncheck all the inputs', function(){
			del.trigger('checkNone', none, 'click');
			expect(dom.getElements('input').get('checked')).toEqual([false, false, false, false, false]);
		});
	});
})();