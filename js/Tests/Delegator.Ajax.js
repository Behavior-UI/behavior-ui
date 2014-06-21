/*
---
name: Delegator.Ajax Tests
description: n/a
requires: [More-Behaviors/Delegator.Ajax]
provides: [Delegator.Ajax.Tests]
...
*/


(function(){

	var getDom = function(filter, wrap){
		var container = new Element('div[id=container]');
		var wrapper = new Element('div[id=wrapper]').inject(container);
		var html = '<p>success!</p><p>really!</p>';
		if (wrap) html = '<div>' + html + '</div>';
		var link = new Element('a[data-trigger=Ajax]', {
			'href': '/echo/html/?html=' + html
		}).inject(container);
		link.setJSONData('ajax-options', {
			'action': filter,
			'target': '!#container #target',
			'useSpinner': false
		});
		var target = new Element('div[id=target]', {'html':'<p>target</p>'}).inject(wrapper);
		return container;
	};
	var results = {
		update: '<div id="target"><p>success!</p><p>really!</p></div>',
		injectTop: '<div id="target"><p>success!</p><p>really!</p><p>target</p></div>',
		injectBottom: '<div id="target"><p>target</p><p>success!</p><p>really!</p></div>',
		replace: '<p>success!</p><p>really!</p>',
		injectAfter: '<div id="target"><p>target</p></div><p>success!</p><p>really!</p>',
		injectBefore: '<p>success!</p><p>really!</p><div id="target"><p>target</p></div>'
	};
	['injectBottom', 'injectTop', 'replace', 'update', 'injectAfter', 'injectBefore'].each(function(action){
		var dom = getDom(action);
		var del = new Delegator().attach(dom),
		    link = dom.getElement('a');
		describe('Delegator.Ajax (' + action + ')', function(){
			it('Should load in ajax: ' + action, function(){
				del.addEvent('trigger', function(trigger, element, event, result){
					expect(result.method).toBe('get');
				});
				del.trigger('Ajax', link, 'click');
				waits(400);
				runs(function(){
					expect(dom.getElement('#wrapper').get('html')).toBe(new Element('div', {html: results[action]}).get('html'));
				});
			});
		});
	});

	['injectBottom', 'injectTop', 'replace', 'update', 'injectAfter', 'injectBefore'].each(function(action){
		var dom = getDom(action);
		var del = new Delegator().attach(dom),
		    link = dom.getElement('a');
		describe('Delegator.Ajax (' + action + ') with a filter', function(){
			it('Should load in ajax with a filter: ' + action, function(){
				link.setData('ajax-filter', 'p');
				del.trigger('Ajax', link, 'click');
				waits(400);
				runs(function(){
					expect(dom.getElement('#wrapper').get('html')).toBe(new Element('div', {html: results[action]}).get('html'));
				});
			});
		});
	});

	// test method option
	var dom = getDom('update');
	var del = new Delegator().attach(dom),
	    link = dom.getElement('a');
	describe('Delegator.Ajax (update) using POST', function(){
		it('Should load in ajax: update', function(){
			link.setJSONData('ajax-options', {
				'action': 'update',
				'target': '!#container #target',
				'method': 'post',
				'useSpinner': false
			});


			var api = new BehaviorAPI(link, 'ajax');
			api.setDefault('method', 'post');
			del.addEvent('trigger', function(trigger, element, event, result){
				expect(result.method).toBe('post');
			});
			del.trigger('Ajax', link, 'click');
			waits(400);
			runs(function(){
				expect(dom.getElement('#wrapper').get('html')).toBe(new Element('div', {html: results['update']}).get('html'));
			});
		});
	});

})();