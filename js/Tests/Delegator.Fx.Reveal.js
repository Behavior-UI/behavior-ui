/*
---
name: Delegator.FxReveal Tests
description: n/a
requires: [More-Behaviors/Delegator.FxReveal]
provides: [Delegator.FxReveal.Tests]
...
*/


(function(){
	var dom = new Element('div', {styles: { display: 'block'}}).set('html',
		'<p>\
			<a style="display: block" id="toggleParent" data-trigger="toggleReveal" data-togglereveal-options="\'target\':\'!div\', \'fxOptions\':{\'duration\': 0}">Toggle parent</a>\
			<a style="display: block" id="toggleSelf" data-trigger="toggleReveal" data-togglereveal-options="\'fxOptions\':{\'duration\': 0}">Toggle self</a>\
			<a style="display: block" id="revealParent" data-trigger="reveal" data-reveal-options="\'target\':\'!div\', \'fxOptions\':{\'duration\': 0}">Reveal Parent</a>\
			<a style="display: block" id="revealSelf" data-trigger="reveal" data-reveal-options="\'fxOptions\':{\'duration\': 0}">Reveal Self</a>\
			<a style="display: block" id="dissolveParent" data-trigger="dissolve" data-dissolve-options="\'target\':\'!div\', \'fxOptions\':{\'duration\': 0}">Dissolve parent</a>\
			<a style="display: block" id="dissolveSelf" data-trigger="dissolve" data-dissolve-options="\'fxOptions\':{\'duration\': 0}">Dissolve self</a>\
			<a style="display: block" id="nixParent" data-trigger="nix" data-nix-options="\'target\':\'!div\', \'fxOptions\':{\'duration\': 0}">nix parent</a>\
			<a style="display: block" id="nixSelf" data-trigger="nix" data-nix-options="\'fxOptions\':{\'duration\': 0}">Nix self</a>\
		</p>'
	);

	var del = new Delegator();
	var getEls = function(){
		var clone = dom.clone(true, true);
		del.attach(clone);
		return {
			dom: clone,
			toggleParent: clone.getElement('a#toggleParent'),
			toggleSelf: clone.getElement('a#toggleSelf'),
			revealParent: clone.getElement('a#revealParent'),
			revealSelf: clone.getElement('a#revealSelf'),
			dissolveParent: clone.getElement('a#dissolveParent'),
			dissolveSelf: clone.getElement('a#dissolveSelf'),
			nixParent: clone.getElement('a#nixParent'),
			nixSelf: clone.getElement('a#nixSelf')
		};
	};

	describe('Delegator.FxReveal', function(){
		// parent toggle
		it('should toggle the reveal: parent > hidden', function(){
			var els = getEls();
			expect(els.dom.getStyle('display')).toBe('block');
			del.trigger('toggleReveal', els.toggleParent, 'click');
			waits(35);
			(function(){
				expect(els.dom.getStyle('display')).toBe('none');
			}).delay(30);
		});

		it('should toggle the reveal: parent > visible', function(){
			var els = getEls();
			els.dom.setStyle('display', 'none')
			del.trigger('toggleReveal', els.toggleParent, 'click');
			waits(35);
			(function(){
				expect(els.dom.getStyle('display')).toBe('block');
			}).delay(30);
		});


		// self toggle
		it('should toggle the reveal: self > hidden', function(){
			var els = getEls();
			expect(els.toggleSelf.getStyle('display')).toBe('block');
			del.trigger('toggleReveal', els.toggleSelf, 'click');
			waits(35);
			(function(){
				expect(els.toggleSelf.getStyle('display')).toBe('none');
			}).delay(30);
		});

		it('should toggle the reveal: self > visible', function(){
			var els = getEls();
			els.toggleSelf.setStyle('display', 'none')
			del.trigger('toggleReveal', els.toggleSelf, 'click');
			waits(35);
			(function(){
				expect(els.toggleSelf.getStyle('display')).toBe('block');
			}).delay(30);
		});

		// parent reveal
		it('should not reveal: parent is visible already', function(){
			var els = getEls();
			expect(els.dom.getStyle('display')).toBe('block');
			del.trigger('reveal', els.revealParent, 'click');
			waits(35);
			(function(){
				expect(els.dom.getStyle('display')).toBe('block');
			}).delay(30);
		});

		it('should reveal: parent > visible', function(){
			var els = getEls();
			els.dom.setStyle('display', 'none')
			del.trigger('reveal', els.revealParent, 'click');
			waits(35);
			(function(){
				expect(els.dom.getStyle('display')).toBe('block');
			}).delay(30);
		});

		// self reveal
		it('should not reveal: self is visible already', function(){
			var els = getEls();
			del.trigger('reveal', els.revealSelf, 'click');
			waits(35);
			(function(){
				expect(els.revealSelf.getStyle('display')).toBe('block');
			}).delay(30);
		});

		it('should reveal: self > visible', function(){
			var els = getEls();
			els.revealSelf.setStyle('display', 'none')
			del.trigger('reveal', els.revealSelf, 'click');
			waits(35);
			(function(){
				expect(els.revealSelf.getStyle('display')).toBe('block');
			}).delay(30);
		});

		// parent dissolve
		it('should not dissolve: parent is hidden already', function(){
			var els = getEls();
			els.dom.setStyle('display', 'none');
			del.trigger('dissolve', els.dissolveParent, 'click');
			waits(35);
			(function(){
				expect(els.dom.getStyle('display')).toBe('none');
			}).delay(30);
		});

		it('should dissolve: parent > hidden', function(){
			var els = getEls();
			del.trigger('dissolve', els.dissolveParent, 'click');
			waits(35);
			(function(){
				expect(els.dom.getStyle('display')).toBe('none');
			}).delay(30);
		});

		// parent dissolve
		it('should dissolve: self > hidden', function(){
			var els = getEls();
			del.trigger('dissolve', els.dissolveSelf, 'click');
			waits(35);
			(function(){
				expect(els.dissolveSelf.getStyle('display')).toBe('none');
			}).delay(30);
		});

		it('should dissolve: self > hidden', function(){
			var els = getEls();
			del.trigger('dissolve', els.dissolveSelf, 'click');
			waits(35);
			(function(){
				expect(els.dissolveSelf.getStyle('display')).toBe('none');
			}).delay(30);
		});

		// nix
		it('should nix: self', function(){
			var els = getEls();
			del.trigger('nix', els.nixSelf, 'click');
			waits(35);
			(function(){
				expect(els.nixSelf.getParent()).toBeNull();
			}).delay(30);
		});

		it('should nix: parent', function(){
			var els = getEls();
			els.dom.inject(document.body).setStyle('display', 'none');
			del.trigger('nix', els.nixParent, 'click');
			waits(35);
			(function(){
				expect(els.dom.getParent()).toBeNull();
			}).delay(30);
		});

	});
})();