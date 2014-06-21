/*
---

name: CSS3Slides

description: A simple slideshow base class that adds a class to an active component based on state and controls

requires:
 - Core/Element.Delegation
 - Custom-Event/Element.defineCustomEvent
 - Mobile/Swipe
 - Mobile/Browser.Features.Touch

provides: [CSS3Slides]

...
*/

CSS3Slides = new Class({
  Implements: [Options, Events],
  options: {
    // onInteraction: function(direction, from, to){},
    // onShowStart: function(index){},
    // onShow: function(index){},
    // onAfterClick: function(element){},
    // backWrap: false,
    // loop: false,
    // skipSlideClass: null,
    next: '!.carousel .slide-nav li a.next',
    back: '!.carousel .slide-nav li a.back',
    slides: 'dl',
    activeClass: 'active',
    controls: '!.carousel .slide-nav li a.jump',
    autoPlay: true,
    autoPlayPause: 5000,
    startShowDelay: 0,
    transitionPause: 0,
    startIndex: 0,
    swipe: false
  },
  initialize: function(container, options){
    this.setOptions(options);
    this.element = document.id(container);
    this.slides = this.element.getElements(this.options.slides);
    if (this.options.controls) this.controls = this.element.getElements(this.options.controls);

    this.bound = {
      clickHandler: this._clickHandler.bind(this),
      next: this.next.bind(this),
      back: this.back.bind(this)
    };

    if (this.options.swipe) {
      this.bound.swipeHandler = function(e){
        this.fireEvent('interaction', 'swipe');
        if (e.direction == 'left') this.next(e);
        else if (e.direction == 'right') this.back(e);
      }.bind(this);
    }

    this.attach();
    this.show(this.options.startIndex);
    if (this.options.autoPlay) this.play();
  },
  // disabled: true, // disables all interation
  play: function(){
    this.stop();
    this.timer = this.next.periodical(this.options.autoPlayPause, this);
    return this;
  },
  stop: function(){
    clearInterval(this.timer);
    return this;
  },
  back: function(event){
    var now = this.now;
    var to = this._getIndex(now -1, -1);
    if (to == now) return this;
    if (event) this.fireEvent('interaction', ['back', now, to]).stop();
    this.startShow(to);
    return this;
  },
  next: function(event){
    var now = this.now;
    var to = this._getIndex(now + 1);
    if (to == now) return this;
    if (event) this.fireEvent('interaction', ['next', now, to]).stop();
    this.startShow(to);
    return this;
  },
  now: null,
  attach: function(_method){
    var method = _method || 'addEvent';
    if (this.options.controls) this.element[method]('click:relay(' + this.options.controls + ')', this.bound.clickHandler);
    if (this.options.next) this.element[method]('click:relay(' + this.options.next + ')', this.bound.next);
    if (this.options.back) this.element[method]('click:relay(' + this.options.back + ')', this.bound.back);
    if (this.options.swipe) this.element[method]('swipe', this.bound.swipeHandler);
    return this;
  },
  detach: function(){
    this.attach('removeEvent');
    return this;
  },
  startShow: function(i){
    i = this._getIndex(i);
    this.fireEvent('showStart', i);
    if (this.options.startShowDelay){
      clearTimeout(this.startShowTimer);
      this.startShowTimer = this.show.delay(this.options.startShowDelay, this, i);
    } else {
      this.show(i);
    }
  },
  show: function(i){
    i = this._getIndex(i);

    this.slides.removeClass(this.options.activeClass);
    if (this.controls) this.controls.removeClass(this.options.activeClass);
    this.now = i;
    if (this.options.transitionPause){
      clearTimeout(this.transitionTimer);
      this.transitionTimer = this._afterShowPause.delay(this.options.transitionPause, this);
    } else {
      this._afterShowPause();
    }
    return this;
  },
  _clickHandler: function(e, element){
    if (this.disabled) return;
    if (e) this.fireEvent('interaction', 'controls');
    this.stop();
    e.preventDefault();
    var target = this.element.getElement(element.get('href'));
    var i = this.slides.indexOf(target);
    if (i == this.now) return;
    this.startShow(i);
    this.fireEvent('afterClick', element);
  },
  _afterShowPause: function(){
    var slide = this.slides[this.now].addClass(this.options.activeClass);
    if (this.controls) this.controls.filter('[href=#' + slide.get('id') + ']').addClass(this.options.activeClass);
    this.fireEvent('show', this.now);
  },
  _getIndex: function(i, iterateBy){
    if (i >= this.slides.length) i = this.options.loop ? 0 : this.slides.length - 1;
    if (i < 0) i = this.options.backWrap ? this.slides.length - 1 : 0;

    if (this.options.skipSlideClass){
      iterateBy = iterateBy || 1;
      while (this.slides[i].hasClass(this.options.skipSlideClass)){
        i = this._getIndex(i + iterateBy, iterateBy);
      }
    }

    return i;
  }
});