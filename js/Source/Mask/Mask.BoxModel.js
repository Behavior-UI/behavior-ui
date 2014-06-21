/*
---

name: Mask.BoxModel

description: Makes Mask work with elements when their box-sizing is border-box.

requires:
 - Core/DomReady
 - Core/Element.Dimensions
 - More/Mask

provides: [Mask.BoxModel]

...
*/

(function(){

  var isBorderBox = function(element){
    return element == document.body || element.getStyle('box-sizing') != 'border-box';
  };

  Class.refactor(Mask, {
    useIframeShim: false,
    resize: function(x, y){

      // this patch also supports border-radius
      this.element.setStyle('borderRadius', this.target.getStyle('border-radius'));

      // if target isn't border-box, just do what original implementation does.
      if (isBorderBox(this.target)) return this.previous.apply(this, arguments);
      // otherwise, do everything the original does but don't include border and padding
      var dim = this.target.getSize();
      this.element.setStyles({
        width: x || dim.x,
        height: y || dim.y,
      });

      return this;
    },

    position: function(){
      // if target isn't border-box, just do what original implementation does.
      if (isBorderBox(this.target)){
        return this.previous.apply(this, arguments);
      }

      this.resize(this.options.width, this.options.height);

      this.element.position({
        relativeTo: this.target,
        position: 'topLeft',
        ignoreMargins: !this.options.maskMargins,
        ignoreScroll: this.target == document.body,
        offset: {
          x: - this.target.getStyle('border-left-width').toInt(),
          y: - this.target.getStyle('border-top-width').toInt()
        }
      });

      return this;
    }
  });

})();