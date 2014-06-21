/*
---

name: Behavior.ToSource

description: Behavior for displaying the source of the element with this behavior as the content of a target element.

requires:
 - Behavior/Behavior

provides: [Behavior.ToSource]

...
*/

Behavior.addGlobalFilter('ToSource', {
  setup: function(element, api){
    var target = api.getElement('target');
    element.store('toSourceTarget', target);
    if (api.getAs(Boolean, 'includeHTML')){
      target.adopt(new Element('pre', {text: element.outerHTML}));
    }
  }
});

['Chart', 'Chart.Stock'].each(function(name){
  Behavior.addGlobalPlugin(name, name + '.ToSource', function(el, api, instance){
    if (el.hasBehavior('ToSource')){
      instance.addEvent('update', function(){
        new Element('h4', {html: 'JSON: '}).inject(el.retrieve('toSourceTarget'));
        new Element('i.json', { html: instance.request.response.text }).inject(el.retrieve('toSourceTarget'));
      });
    }
  });
});

