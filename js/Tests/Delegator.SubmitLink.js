/*
---
name: Delegator.SubmitLink Tests
description: n/a
requires: [More-Behaviors/Delegator.SubmitLink, More/Form.Request, Core/JSON]
provides: [Delegator.SubmitLink.Tests]
...
*/


(function(){
	var dom = new Element('form', {method: 'post', action: '/ajax_json_echo/'}).set('html',
		'<input type="text" name="one" value="1">\
			<a data-trigger="submitLink" data-submitlink-target="!form" data-submitlink-options="\'extraData\': {\'foo\':\'bar\'}">Submit the form</a>'
	);
	var del = new Delegator().attach(dom),
	    link = dom.getElement('a');
	describe('Delegator.SubmitLink', function(){
		it('should submit the parent form', function(){
			var div = new Element('div');
			new Form.Request(dom, div, {
				requestOptions: {
					useSpinner: false
				}
			});
			del.trigger('submitLink', link, 'click');
			waits(500);
			runs(function(){
				expect(JSON.decode(div.get('html'))).toEqual({"post_response": {"foo": "bar", "one": "1"}, "get_response": {}});
			});
		});
	});
})();