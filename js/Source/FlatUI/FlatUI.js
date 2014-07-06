/*
---

name: FlatUI

description: Basic setup for FlatUI CSS to operate properly

requires:
 - Core/DomReady
 - Core/Element.Dimensions

provides: [FlatUI]

...
*/

var FlatUI = {};

window.addEvent('domready', function(){

  document.addEvents({
    // flatui expects that when you focus an input that the parent .form-group has the "focus" class
    // which allows all the controls in that container to be styled for that state.
    'focus:relay(input,select,textarea)': function(event, input){
      var parent = input.getParent('.form-group, .input-group');
      if (parent) parent.addClass('focus');
    },
    'blur:relay(input,select,textarea)': function(event, input){
      var parent = input.getParent('.form-group, .input-group');
      if (parent) parent.removeClass('focus');
    }
  });

});

window.addEvent('load', function(){
  if (!window.behavior || !behavior.getFilter('FlatUI.Select')) return;

  var styleSelect = function(select){
    if (select.hasBehavior('FlatUI.Select') || select.hasClass('no-flat-select')) return;
    behavior.applyFilter(select, behavior.getFilter('FlatUI.Select'));
  };

  var styleSelects = function(container){
    if (container.get('tag') == 'select') styleSelect(container);
    else container.getElements('select').each(styleSelect);
  };
  styleSelects(document.body);
  behavior.addEvent('ammendDom', styleSelects);
});
