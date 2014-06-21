/*
---
name: Delegator.SetProperty Tests
description: n/a
requires: [More-Behaviors/Delegator.setProperty]
provides: [Delegator.SetProperty.Tests]
...
*/


(function(){
	var dom = new Element('div', {'class':'foo'}).set('html',
		'<p>\
			<a id="toggleParent" data-trigger="toggleProperty" data-toggleproperty-options="\'target\':\'!div.foo\', \'property\':\'title\', \'value\':\'set\'">Toggle the title value</a>\
			<a id="toggleSelf" data-trigger="toggleProperty" data-toggleproperty-options="\'property\':\'title\', \'value\':\'set\'">Toggle the title value</a>\
			<a id="setParent" data-trigger="setProperty" data-setproperty-options="\'target\':\'!div.foo\', \'property\':\'title\', \'value\':\'set\'">Add the title value</a>\
			<a id="setSelf" data-trigger="setProperty" data-setproperty-options="\'property\':\'title\', \'value\':\'set\'">Add the title value</a>\
			<a id="eraseParent" data-trigger="eraseProperty" data-eraseproperty-options="\'target\':\'!div.foo\', \'property\':\'title\'">Remove the title value</a>\
			<a id="eraseSelf" data-trigger="eraseProperty" data-eraseproperty-options="\'property\':\'title\'">Remove the title value</a>\
		</p>'
	);

	var del = new Delegator().attach(dom),
	    setParent = dom.getElement('a#setParent'),
	    setSelf = dom.getElement('a#setSelf'),
	    eraseParent = dom.getElement('a#eraseParent'),
	    eraseSelf = dom.getElement('a#eraseSelf'),
	    toggleParent = dom.getElement('a#toggleParent'),
	    toggleSelf = dom.getElement('a#toggleSelf');

	describe('Delegator.SetProperty', function(){
		it('should toggle the title on a target', function(){
			expect(dom.get('title')).toBe(null);
			del.trigger('toggleProperty', toggleParent, 'click');
			expect(dom.get('title')).toBe('set');
			del.trigger('toggleProperty', toggleParent, 'click');
			expect(dom.get('title')).toBe(null);
		});
		it('should toggle the title of itself', function(){
			expect(toggleSelf.get('title')).toBe(null);
			del.trigger('toggleProperty', toggleSelf, 'click');
			expect(toggleSelf.get('title')).toBe('set');
			del.trigger('toggleProperty', toggleSelf, 'click');
			expect(toggleSelf.get('title')).toBe(null);
		});
		it('should add and erase the title to a target', function(){
			expect(dom.get('title')).toBe(null);
			del.trigger('setProperty', setParent, 'click');
			expect(dom.get('title')).toBe('set');
			del.trigger('eraseProperty', eraseParent, 'click');
			expect(dom.get('title')).toBe(null);
		});
		it('should add and erase it\'s own title property', function(){
			expect(setSelf.get('title')).toBe(null);
			del.trigger('setProperty', setSelf, 'click');
			expect(setSelf.get('title')).toBe('set');
			setSelf.erase('title');
			eraseSelf.set('title', 'set');
			expect(eraseSelf.get('title')).toBe('set');
			del.trigger('eraseProperty', eraseSelf, 'click');
			expect(eraseSelf.get('title')).toBe(null);
		});
	});
})();