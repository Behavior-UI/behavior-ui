/*
---
name: Delegator.ToggleClass Tests
description: n/a
requires: [More-Behaviors/Delegator.ToggleClass]
provides: [Delegator.ToggleClass.Tests]
...
*/


(function(){
	var dom = new Element('div', {'class':'foo'}).set('html',
		'<p>\
			<a id="toggleParent" data-trigger="toggleClass" data-toggleclass-options="\'target\':\'!div.foo\', \'class\':\'bar\'">Toggle the .bar class</a>\
			<a id="toggleSelf" data-trigger="toggleClass" data-toggleclass-options="\'class\':\'bar\'">Toggle the .bar class</a>\
			<a id="addParent" data-trigger="addClass" data-addclass-options="\'target\':\'!div.foo\', \'class\':\'bar\'">Add the .bar class</a>\
			<a id="addSelf" data-trigger="addClass" data-addclass-options="\'class\':\'bar\'">Add the .bar class</a>\
			<a id="removeParent" data-trigger="removeClass" data-removeclass-options="\'target\':\'!div.foo\', \'class\':\'bar\'">Remove the .bar class</a>\
			<a id="removeSelf" data-trigger="removeClass" data-removeclass-options="\'class\':\'bar\'">Remove the .bar class</a>\
		</p>'
	);

	var del = new Delegator().attach(dom),
	    addParent = dom.getElement('a#addParent'),
	    addSelf = dom.getElement('a#addSelf'),
	    removeParent = dom.getElement('a#removeParent'),
	    removeSelf = dom.getElement('a#removeSelf'),
	    toggleParent = dom.getElement('a#toggleParent'),
	    toggleSelf = dom.getElement('a#toggleSelf');

	describe('Delegator.AddRemoveClass', function(){
		it('should toggle the class on a target', function(){
			expect(dom.hasClass('bar')).toBe(false);
			del.trigger('toggleClass', toggleParent, 'click');
			expect(dom.hasClass('bar')).toBe(true);
			del.trigger('toggleClass', toggleParent, 'click');
			expect(dom.hasClass('bar')).toBe(false);
		});
		it('should toggle the class of itself', function(){
			expect(toggleSelf.hasClass('bar')).toBe(false);
			del.trigger('toggleClass', toggleSelf, 'click');
			expect(toggleSelf.hasClass('bar')).toBe(true);
			del.trigger('toggleClass', toggleSelf, 'click');
			expect(toggleSelf.hasClass('bar')).toBe(false);
		});
		it('should add and remove classes to a target', function(){
			expect(dom.hasClass('bar')).toBe(false);
			del.trigger('addClass', addParent, 'click');
			expect(dom.hasClass('bar')).toBe(true);
			del.trigger('removeClass', removeParent, 'click');
			expect(dom.hasClass('bar')).toBe(false);
		});
		it('should add and remove classes itself', function(){
			expect(addSelf.hasClass('bar')).toBe(false);
			del.trigger('addClass', addSelf, 'click');
			expect(addSelf.hasClass('bar')).toBe(true);
			addSelf.removeClass('bar');
			removeSelf.addClass('bar');
			expect(removeSelf.hasClass('bar')).toBe(true);
			del.trigger('removeClass', removeSelf, 'click');
			expect(removeSelf.hasClass('bar')).toBe(false);
		});
	});
})();