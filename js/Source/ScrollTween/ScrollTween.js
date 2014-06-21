/*
---

name: ScrollTween

description: Animates things based on scroll behavior

requires:
 - Core/DomReady
 - Core/Element.Dimensions
 - More/Fx.Scroll
 - Core/DomReady

provides: [ScrollTween, ScrollTween.manager]

...
*/

var ScrollTween = new Class({
  Implements: [Options],
  options: {
    from: 0,
    to: null,
    onTween: null, //function(percent, [number])
    onStart: null,  //function(scroll, winSize, docSize)
    onEnd: null,  //function(scroll, winSize, docSize)
    tween: {
      element: null,
      style: null,
      from: 0,
      to: 1
    }
  },
  initialize: function(options){
    this.setOptions(options);
    this.element = typeOf(this.options.tween.element) == 'string' ? document.id(this.options.tween.element) : this.options.tween.element;
    this.tween = this.element && this.options.tween.style;
    ScrollTween.manager.register(this);
  },
  start: function(scroll, winSize, docSize){
    this.active = true;
    this.scroll(scroll, winSize, docSize);
    if (this.options.onStart) this.options.onStart.apply(this, arguments);
  },
  end: function(scroll, winSize, docSize){
    this.active = false;
    this.scroll(scroll, winSize, docSize);
    if (this.options.onEnd) this.options.onEnd.apply(this, arguments);
  },
  _now: {},
  scroll: function(scroll, winSize, docSize){
    var to = this.options.to || docSize - winSize;
    this.percent = percent = (scroll - this.options.from) / (to - this.options.from);
    this.under = scroll <= this.options.from;
    this.over = scroll >= this.options.to;
    this.now = scroll;
    if (this.tween){
      var tween = this.options.tween;
      var point = this.getPoint(tween.from, tween.to, this.options.tween.unit);
      this.element.setStyle(this.tween, point.value);
      if (this.options.onTween) this.options.onTween.apply(this, [percent, point.number]);
    } else {
      if (this.options.onTween) this.options.onTween.apply(this, [percent]);
    }
  },
  getPoint: function(start, end, unit){
    var to,
        diff = end - start,
        offset = diff * this.percent,
        point = offset + start;
    if (start > end) to = point.limit(end, start);
    else to = point.limit(start, end);
    return {
      number: to,
      value: unit ? to + unit : to
    };
  }
});

ScrollTween.manager = {
  _instances: [],
  init: function(){
    this.bound = {
      onScroll: this.onScroll.bind(this),
      onResize: this.onResize.bind(this)
    };
    this.attach();
    this.onResize();
  },
  attach: function(detach){
    window[detach ? 'removeEvent' : 'addEvent']('scroll', this.bound.onScroll);
    window[detach ? 'removeEvent' : 'addEvent']('resize', this.bound.onResize);
  },
  register: function(instance){
    this._instances.push(instance);
    instance.scroll(this.scroll, this.winSize, this.docSize);
  },
  scrollEnd: null,
  onScroll: function(finalize){
    this.scroll = window.getScroll().y;
    for (var i = 0; i < this._instances.length; i++){
      this.calculate(this._instances[i], this.scroll, false, i);
    }
    clearTimeout(this.scrollEnd);
    if (finalize) this.scrollEnd = this.onScroll.delay(20, this, [true]);
  },
  calculate: function(instance, scroll, finalize, index){
    var to = instance.options.to || this.docSize,
        from = instance.options.from;
    var inRange = to > scroll &&
                  from < scroll;
    if (inRange){
      if (!instance.active) instance.start(scroll, this.winSize, this.docSize);
      instance.scroll(scroll, this.winSize, this.docSize);
    } else if (instance.active ||
        (instance.now < instance.options.from && scroll > instance.options.to) ||
        (instance.now > instance.options.to && scroll < instance.options.from)
      ){
      instance.end(scroll, this.winSize, this.docSize);
    }
  },
  onResize: function(){
    this.scroll = window.getScroll().y;
    this.winSize = window.getSize().y;
    this.docSize = document.body.getScrollSize().y;
  }
};

window.addEvent('domready', function(){
  ScrollTween.manager.init();
});