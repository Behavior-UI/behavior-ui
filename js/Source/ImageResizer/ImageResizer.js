/*
---

name: ImageResizer.js

description: Resizes an image using a canvas, if supported.

requires:
 - Core/Options
 - Core/Events

provides: [ImageResizer]

...
*/

ImageResizer = new Class({

  Implements: [Options, Events],

  options: {
    // onComplete: function(dataURL){ invoked after resize complete },
    preferredWidth: 1000
  },

  initialize: function(fileInput, options){
    // store reference to file input
    this.file = document.id(fileInput).files[0];
    this.setOptions(options);
    // create canvas and drop into DOM, hidden
    this.canvas = new Element('canvas', {styles: {display: 'none'}}).inject(document.body);
    // determine if canvas and toDataURL are supported in the browser
    this.isSupported() ? this.resize() : this.handleUnsupported();
  },

  isSupported: function(){
    return !!(this.canvas.getContext && this.canvas.getContext('2d') && this.canvas.toDataURL)
  },

  handleUnsupported: function(){
    this.destroy();
    this.fireEvent('error');
  },

  resize: function(){
    // create file reader instance, watch for load, and read the file
    this.reader = new FileReader();
    this.reader.onload = this.read.bind(this);
    this.reader.readAsDataURL(this.file);
  },

  read: function(event){
    // create an image element with the src set to our read file
    // then resize
    this.img = new Image();
    this.img.src = event.target.result;
    this.img.addEvent('load', this.resizeInCanvas.bind(this));
  },

  resizeInCanvas: function(){
    // compute ideal ratio and size, assign to canvas
    var preferredWidth = this.options.preferredWidth;
    // only resize if the image is wider than preferredWidth
    var ratio = this.img.width > preferredWidth ? preferredWidth / this.img.width : 1;
    this.canvas.width = this.img.width * ratio;
    this.canvas.height = this.img.height * ratio;
    var ctx = this.canvas.getContext("2d");
    ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
    // read new data url for image output and call our complete event
    this.fireEvent('complete', this.canvas.toDataURL('image/jpeg'));
    // clean up what we created
    this.destroy();
  },

  destroy: function(){
    if (this.img) this.img.destroy();
    this.canvas.destroy();
  }

});
