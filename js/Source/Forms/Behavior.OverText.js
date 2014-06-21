/*
---
description: Sets up an input to have an OverText instance for inline labeling. This is a global filter.
provides: [Behavior.OverText]
requires: [Behavior/Behavior, More/OverText]
script: Behavior.OverText.js
name: Behavior.OverText
...
*/
Behavior.addGlobalFilter('OverText', function(element, api){

  //create the overtext instance
  var ot = new OverText(element, {
    textOverride: api.get('textOverride')
  });
  if (element.get('class')){
    element.get('class').split(' ').each(function(cls){
      if (cls) ot.text.addClass('overText-'+cls);
    });
  }
  element.getBehaviors().each(function(filter){
    if (filter != "OverText") ot.text.addClass('overText-'+filter);
  });

  //this method updates the text position with a slight delay
  var updater = function(){
    ot.reposition.delay(10, ot);
  };

  //update the position whenever the behavior element is shown
  api.addEvent('layout:display', updater);

  api.onCleanup(function(){
    api.removeEvent('layout:display', updater);
    ot.destroy();
  });

  return ot;

});
