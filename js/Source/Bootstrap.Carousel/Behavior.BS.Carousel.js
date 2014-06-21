/*
---

name: Behavior.BS.Carousel

description: Behavior for bootstrap's Carousel.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Slides

provides: [Behavior.BS.Carousel]

...
*/

Behavior.addGlobalFilter('BS.Carousel', {
  defaults: {
    startShowDelay: 625,
    next: '.carousel-control.right',
    back: '.carousel-control.left',
    slides: '.carousel-inner .item',
    controls: '.carousel-indicators li',
    loop: true,
    backWrap: true,
    swipe: false
  },
  returns: Slides,
  setup: function(element, api){
    var slides = new Slides(element, Object.cleanValues(
        api.getAs({
          next: String,
          back: String,
          slides: String,
          activeClass: String,
          controls: String,
          autoPlay: Boolean,
          autoPlayPause: Number,
          loop: Boolean,
          backWrap: Boolean,
          transitionPause: Number,
          startIndex: Number,
          startShowDelay: Number,
          swipe: Boolean,
          skipSlideClass: String
        })
      )
    );

    slides.addEvents({
      showStart: function(to){
        var now = slides.now;
        var direction = now > to ? 'right' : 'left';
        slides.slides[to].addClass(now > to ? 'prev' : 'next');
        slides.slides[to].offsetWidth; //force reflow
        slides.slides[now].addClass(direction);
        slides.slides[to].addClass(direction);
      },
      show: function(now){
        slides.slides.removeClass('left').removeClass('right').removeClass('prev').removeClass('next');
      }
    });

    api.onCleanup(function(){
      slides.stop().detach();
    });

    return slides;
  }
});