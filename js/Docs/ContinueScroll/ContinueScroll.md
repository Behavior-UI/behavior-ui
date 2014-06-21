
/*
---

name: ContinueScroll

description: Extends Fx.Scroll to continue a user's scroll if the scroll amount
passes the given threshold.

requires:
 - /Fx.Scroll

provides: [ContinueScroll]

...
*/

var ContinueScroll = new Class({

  Extends: Fx.Scroll,

  options: {
    scrollAxis: 'y',
    transition: 'expo:in:out',
    threshold: 0.1,
    completeClass: 'finished-scrolling'
  },

  initialize: function(element, options){
    this.element = element;
    this.setOptions(options);
    this.parent(this.element, this.options);
    this.timer;
    this.previousScroll = element.getScroll();
    this.bottomRight = this.options.scrollAxis == 'x' ? 'toRight' : 'toBottom';
    this.topLeft = this.options.scrollAxis == 'x' ? 'toLeft' : 'toTop';

    this.attach();
  },

  attach: function(detach){
    var eventMethod = detach || 'addEvent';
    this.element[eventMethod]('scroll', this.scroller.bind(this));
    this[eventMethod]('cancel', this.onCancel.bind(this));
  },

  detach: function(){
    this.attach('removeEvent');
  },

  scroller: function(){
    clearTimeout(this.timer);
    this.timer = setTimeout(this.finishedScrolling.bind(this), 100);
  },

  finishedScrolling: function(){
    var size = this.element.getSize();

    var currentScroll = this.element.getScroll();
    var currentPercentage = currentScroll[this.options.scrollAxis]/size[this.options.scrollAxis];

    if (currentScroll[this.options.scrollAxis] >= this.previousScroll[this.options.scrollAxis]){
      // we are scrolling right/down
      if (currentPercentage > this.options.threshold){
        this.fireEvent('bottomRightBegin');
        this[this.bottomRight]().chain(this.bottomRightComplete);
      } else this[this.topLeft]();
    } else {
      // we are scrolling left/up
      if ((1.0 - currentPercentage) > this.options.threshold){
        this.fireEvent('topLeftBegin');
        this[this.topLeft]().chain(this.topLeftComplete);
      } else this[this.bottomRight]();
    }

    this.previousScroll = currentScroll;
  },

  onCancel: function(){
    // this means we've scrolled all the way, so the scroller doesn't fire
    var currentScroll = this.element.getScroll();
    var size = this.element.getSize();
    if (currentScroll[this.options.scrollAxis] > size[this.options.scrollAxis]/2){
      this.bottomRightComplete();
    } else {
      this.topLeftComplete();
    }
  },

  bottomRightComplete: function(){
    this.fireEvent('bottomRightComplete');
  },

  topLeftComplete: function(){
    this.fireEvent('topLeftComplete');
  }


});
