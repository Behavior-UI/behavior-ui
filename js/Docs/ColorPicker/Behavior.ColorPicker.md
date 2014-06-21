/*
---

name: Behavior.ColorPicker

description: Shows a color chooser when the user focuses an input.

requires:
 - Behavior/Behavior
 - /mooRainbow

provides: [Behavior.ColorPicker]

...
*/

(function(){
  var hexCheck = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  Behavior.addGlobalFilter('ColorPicker', {
    setup: function(el, api){
      var startColor = api.get('startColor');
      if (typeOf(startColor) == "string" && startColor.match(hexCheck)) startColor = startColor.hexToRgb(startColor);
      /*
        optional explicit paths:
        'moor_woverlay.png'
        'moor_boverlay.png'
        'blank.gif'
        'moor_slider.png'
        'moor_cursor.gif'
      */
      var paths = api.get('imgs');
      return new MooRainbow(el, {
        imgPath: api.get('imgPath'),
        startColor: startColor,
        getImage: function(file){
          return paths && paths[file] ? paths[file] : this.options.imgPath + file;
        },
        onChange: function(color){
          el.set('value', color.hex);
          if (api.get('update')){
            api.getElements('update').setStyles({
              backgroundColor: color.hex,
              backgroundImage: 'none'
            });
          }
        }
      });
    }
  });
})();