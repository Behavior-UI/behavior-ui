/*
---

name: Spinner.CSS

description: Allows Spinner class to render more complex DOM for CSS spinner styling.

requires:
 - More/Spinner
 - More/Class.Refactor

provides: [Spinner.CSS]

...
*/

Class.refactor(Spinner, {

  options: {
    cssSpinner: true
  },

  render: function(){
    this.previous.apply(this, arguments);
    this.img.destroy();
    var img = this.img = new Element('div.css-spinner');
    var size = this.target.getSize();
    if (size.x && size.y && (size.x < 100 || size.y < 100)) img.addClass('spinner-small');

    if (this.target.get('data-spinner-class')) img.addClass(this.target.get('data-spinner-class'));
    if (this.target.get('data-mask-class')) this.element.addClass(this.target.get('data-mask-class'));

    (12).times(function(i){
      img.adopt(new Element('div.bar' + (i+1)));
    });
    img.inject(this.content);
  }

});