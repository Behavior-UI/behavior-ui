/*
---
provides: Swipe
license: MIT-style
requires: [Core/Element.Event]
description: Adds element.addEvent('swipe', fn). fn is passed information about the swipe location and direction.
authors:
- 3n
...
*/

['touchstart', 'touchmove', 'touchend'].each(function(type){
  Element.NativeEvents[type] = 2;
});

Element.Events.swipe = {
  onAdd: function(fn){
    var startX, startY, active = false;

    var touchStart = function(event){
      active = true;
      startX = event.event.touches[0].pageX;
      startY = event.event.touches[0].pageY;
    };
    var touchMove = function(event){
      var endX   = event.event.touches[0].pageX,
          endY   = event.event.touches[0].pageY,
          diffX   = endX - startX,
          diffY   = endY - startY,
          isLeftSwipe = diffX < -1 * Element.Events.swipe.swipeWidth,
          isRightSwipe = diffX > Element.Events.swipe.swipeWidth;

      if (active && (isRightSwipe || isLeftSwipe)
          && (event.onlySwipeLeft ? isLeftSwipe : true)
          && (event.onlySwipeRight ? isRightSwipe : true) ){
        active = false;
        fn.call(this, {
          'direction' : isRightSwipe ? 'right' : 'left',
          'startX'    : startX,
          'endX'      : endX
        });
      } else if (Element.Events.swipe.cancelVertical
          && Math.abs(startY - endY) < Math.abs(startX - endX)){
        return false;
      } else {
        var isUpSwipe = diffY < -1 * Element.Events.swipe.swipeHeight,
          isDownSwipe = diffY > Element.Events.swipe.swipeHeight;

	      if (active && (isUpSwipe || isDownSwipe)
	          && (event.onlySwipeDown ? isDownSwipe : true)
	          && (event.onlySwipeUp ? isUpSwipe : true) ){
	        active = false;
	        fn.call(this, {
	          'direction' : isUpSwipe ? 'up' : 'down',
	          'startY'    : startY,
	          'endY'      : endY
	        });
	      }
      }
    }

    this.addEvent('touchstart', touchStart);
    this.addEvent('touchmove', touchMove);

    var swipeAddedEvents = {};
    swipeAddedEvents[fn] = {
      'touchstart' : touchStart,
      'touchmove'  : touchMove
    };
    this.store('swipeAddedEvents', swipeAddedEvents);
  },

  onRemove: function(fn){
    $H(this.retrieve('swipeAddedEvents')[fn]).each(function(v,k){
      this.removeEvent(k,v);
    }, this);
  }
};

Element.Events.swipe.swipeWidth = 70;
Element.Events.swipe.swipeHeight = 70;
Element.Events.swipe.cancelVertical = true;





/*
x-x-x-

name: Swipe

description: Provides a custom swipe event for touch devices

authors: Christopher Beloch (@C_BHole), Christoph Pojer (@cpojer), Ian Collins (@3n)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Swipe

.x.x.x


(function(){

var name = 'swipe',
	distanceKey = name + ':distance',
	cancelKey = name + ':cancelVertical',
	dflt = 50;

var start = {}, disabled, active;

var clean = function(){
	active = false;
};

var events = {

	touchstart: function(event){
		if (event.touches.length > 1) return;

		var touch = event.touches[0];
		active = true;
		start = {x: touch.pageX, y: touch.pageY};
	},

	touchmove: function(event){
		if (disabled || !active) return;

		var touch = event.changedTouches[0],
			end = {x: touch.pageX, y: touch.pageY};
		if (this.retrieve(cancelKey) && Math.abs(start.y - end.y) > 10){
			active = false;
			return;
		}

		var distance = this.retrieve(distanceKey, dflt),
			delta = end.x - start.x,
			isLeftSwipe = delta < -distance,
			isRightSwipe = delta > distance;

		if (!isRightSwipe && !isLeftSwipe)
			return;

		event.preventDefault();
		active = false;
		event.direction = (isLeftSwipe ? 'left' : 'right');
		event.start = start;
		event.end = end;

		this.fireEvent(name, event);
	},

	touchend: clean,
	touchcancel: clean

};

Element.defineCustomEvent(name, {

	onSetup: function(){
		this.addEvents(events);
	},

	onTeardown: function(){
		this.removeEvents(events);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
		clean();
	}

});

})();

*/