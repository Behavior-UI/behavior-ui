/*
---

name: Behavior.FlatUI.FormValidator

description: Adds validation state css class to form-group elements when their inner inputs fail.

requires:
 - Behavior.FormValidator

provides: [Behavior.FlatUI.FormValidator]

...
*/

/*

  If you're using standard FlatUI / Bootstrap markup, this plugin will add the 'validation-failed' class
  to the parent '.form-group' element whenever an input fails validation. You can then style the contents
  as you like. In FlatUI, this means you can make inputs w/ suffix buttons both have the red outline.

*/


(function(){
  var plugin = {
    setup: function(element, api, instance){
      instance.addEvent('elementFail', function(field){
        var fg = field.getParent('.form-group');
        if (fg) fg.addClass('validation-failed');
      });

      instance.addEvent('elementPass', function(field){
        var fg = field.getParent('.form-group');
        if (fg) fg.removeClass('validation-failed');
      });
    }
  };

  Behavior.addGlobalPlugin("FormValidator", "FlatUI.FormValidator", plugin);
  Behavior.addGlobalPlugin("FormValidator.BS.Tips", "FlatUI.FormValidator.BS.Tips", plugin);

})();

