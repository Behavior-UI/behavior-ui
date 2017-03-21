/*
---

name: Behavior.Slider.Modify

description: Behavior for creating an interactive slider that can update and
             modify the contents of elements with the value from the slider.

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - Behavior-UI/Slider.Modify

provides: [Behavior.Slider.Modify]

...
*/
Behavior.addGlobalFilter('Slider.Modify', {
  defaults: {
    knob: '~.slider-knob',
    fill: '.slider-fill',
    startRange: 1,
    offset: 0,
    jumpstart: false,
    formSubmitDelay: 1000,
  },
  requireAs: {
    endRange: Number,
    initialStep: Number
  },
  returns: Slider.Modify,

  setup: function(element, api){
    // slideFill is optional
    var slideFill = api.get('fill') ? api.getElement('fill') : null;
    var knob = api.getElement('knob');
    var targets = api.getAs(Array, 'targets');
    var tapFillElement
    var moveClassTargets;
    if(api.get('moveClassTargets')) moveClassTargets = api.getElements('moveClassTargets');

    if (!targets && targets.length) api.fail('Unable to find targets option.');

    if (api.getAs(Number, 'roundAfterSnap') !== null && api.getAs(Number, 'roundAfterSnap') <= 0){
      api.fail('Error: roundAfterSnap must be greater than zero.');
    }
    var formTarget;
    if (api.get('formToSubmit')) formTarget = api.getElement('formToSubmit');

    // instantiate a new Slider.Modify instance.
    var slider = new Slider.Modify(
      element,
      knob,
      {
        steps: api.getAs(Number, 'steps'),
        range: [api.getAs(Number, 'startRange'), api.getAs(Number, 'endRange')],
        initialStep: api.getAs(Number, 'initialStep'),
        slideFill: slideFill,
        targets: targets,
        offset: api.getAs(Number, 'offset'),
        moveClassTargets: moveClassTargets,
        moveClass: api.get('moveClass'),
        jumpstart: api.getAs(Boolean, 'jumpstart'),
        snap: api.getAs(Boolean, 'snap'),
        roundAfterSnap: api.getAs(Number, 'roundAfterSnap')
      }
    );
    if(api.get('tapFillElement')){
      var tapEvent =  function(){
        slider.set(slider.options.range[1]);
      }
      api.getElement('tapFillElement').addEvent('mousedown', tapEvent);

      api.onCleanup(function(){
        api.removeEvent('mousedown', tapEvent);
      });
    }
    if(formTarget){
      var timer;
      slider.addEvent('move', function(){
        clearTimeout(timer);
        timer = setTimeout(formTarget.submit, api.get('formSubmitDelay'));
      });
    }
    api.onCleanup(slider.detach.bind(slider));

    return slider;
  }
});
