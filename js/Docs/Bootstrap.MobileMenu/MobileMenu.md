/*
---

name: MobileMenu

description: Reveals a dropdown menu, provides 'tap outside to close' functionality

requires:
 - Core/Element.Delegation
 - More/Fx.Reveal

provides: [MobileMenu]

...
*/

var MobileMenu = new Class({

  Implements: [Options],

  options: {
    zIndex: 500,
    revealClass: 'reveal'
  },

  initialize: function(button, target, options){
    this.button = button;
    this.target = target;
    this.setOptions(options);
    this.target.setStyle('z-index', this.options.zIndex);
    this.createMask();
    this.attach();
  },

  revealed: false,

  attach: function(_detach){
    if (!this.boundEvents){
      this.boundEvents = {
        toggle: this.toggle.bind(this),
        hide: this.hide.bind(this)
      };
    }
    var method = _detach ? 'removeEvent' : 'addEvent';
    this.button[method]('click', this.boundEvents.toggle);
    if (this.mask) this.mask[method]('click', this.boundEvents.hide);
    // when clicking on a link within the target (the menu), hide the menu
    // this is helpful for the case that the link goes to an anchor on the current page
    this.target[method]('click:relay(a)', this.boundEvents.hide);
  },

  detach: function(){
    this.attach(true);
  },

  createMask: function(){
    this.mask = MobileMenu.mask;
    if (!this.mask || !document.body.hasChild(this.mask)){
      this.mask = MobileMenu.mask = new Element('div', {
        styles: {
          position: 'fixed',
          top: '0',
          height: '100%',
          width: '100%',
          'z-index': this.options.zIndex - 1,
          display: 'none'
        }
      });
      this.mask.inject(this.target, 'after');
    }
  },

  hide: function(){
    this.target.removeClass(this.options.revealClass);
    if (this.mask) this.mask.setStyle('display', 'none');
    this.revealed = false;
  },

  reveal: function(){
    this.target.addClass(this.options.revealClass);
    this.target.mask();
    if (this.mask) this.mask.setStyle('display', 'block');
    this.revealed = true;
  },

  toggle: function(){
    this[this.revealed ? 'hide' : 'reveal']();
  }
});