/*
---

name: Behavior.ColorPicker

description: Shows a color chooser when the user focuses an input.

requires:
 - Behavior/Behavior
 - ColorPicker

provides: [Behavior.ColorPicker]

...
*/

(function(){
  var hexCheck = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  // counter allows for multiple instances per page
  var counter = 0;

  Behavior.addGlobalFilter('ColorPicker', {

    defaults: {
      'property': 'backgroundColor',
      'setOnStart': true
    },

    returns: ColorPicker,

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
      counter++;
      return new ColorPicker(el, {
        id: 'mooRainbow'+counter,
        imgPath: api.get('imgPath'),
        startColor: startColor,
        setOnStart: api.getAs(Boolean, 'setOnStart'),
        getImage: function(file){
          return paths && paths[file] ? paths[file] : this.options.imgPath + file;
        },
        onChange: function(color){
          el.set('value', color.hex);
          if (api.get('update')){
            var stylesObj = {
              backgroundImage: 'none'
            };
            stylesObj[api.get('property')] = color.hex;
            api.getElements('update').setStyles(stylesObj);
          }
        }
      });
    }
  });
})();
