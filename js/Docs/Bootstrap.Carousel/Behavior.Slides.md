/*
---

name: Behavior.CSS3Slides

description: Behavior for a basic CSS driven slideshow.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - /CSS3Slides

provides: [Behavior.CSS3Slides]

...
*/

Behavior.addGlobalFilter('CSS3Slides', {
	setup: function(element, api){
		var slides = new CSS3Slides(element, Object.cleanValues(
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
					skipSlideClass: String
				})
			)
		);

		api.onCleanup(function(){
			slides.stop().detach();
		});

		return slides;
	}
});