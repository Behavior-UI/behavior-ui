/*
---

name: Behavior.InteractiveMessageList

description: Gives InteractiveList the ability to initially select an arbitrary member,
             decrement a counter and add a 'read' class. It also allows more than
             one InteractiveMessageList to share a group, and only one is marked
             as selected at a time.

license: MIT-style license.

authors: [Davy Wentworth]

requires:
 - InteractiveList

provides: [Behavior.InteractiveMessageList]

...
*/

Behavior.addGlobalPlugin('InteractiveList', 'InteractiveMessageList', function(el, api, instance){
  var selected = el.getElement(api.get('initialSelect'));
  instance.addEvent('select', function(){
    el.getElements('.blur').removeClass('blur');
    var date = instance.currentlySelected.getElement(api.get('markAsRead'));
    if (date && !date.hasClass('read')){
      date.addClass('read');
    }
    var unreadSection = el.getElement(api.get('unreadSection'));
    if (unreadSection){
      var count = unreadSection.getElement('span.count');
      if (count){
        count.set('html', count.get('html').toInt() - 1);
        if (count.get('html').toInt() < 1) unreadSection.addClass('hide');
      }
    }
  });

  if (selected){
    instance.select(selected);
  }

  api.addEvent('interactiveListSelect', function(selectedEl, list){
    if (list != instance && instance.currentlySelected) instance.currentlySelected.addClass('blur').removeClass('selected');
  });
});