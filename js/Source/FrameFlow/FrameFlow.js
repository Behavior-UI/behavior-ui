
/*
---

name: FrameFlow

description: Provides a simplified Finite State Machine for managing UI flows in which
  transitions and states are encapsulated into Frame instances

requires:
 - Core/Class.Extras
 - Core/Element.Delegation
 - Behavior/Element.Data

provides: [FrameFlow]

...
*/

var FrameFlow = new Class({

  Implements: [Options],

  options: {
    startIndex: 0
  },

  frames: [],

  initialize: function(element, options){
    this.element = element;
    this.setOptions(options);

    this.currentIndex = this.options.startIndex;

    this.refresh();
    // set up the controls
    this.attach();

    // set the first frame to active
    this.frames.some(function(frame, index){
      frame.addState('activeState');
      if (index == this.options.startIndex) return true;
      frame.addState('exitState');
      return false;
    }, this);
    // this.frames[this.options.startIndex].addState('activeState');
  },

  refresh: function(){

    // find all frames
    this.frameElements = this.element.getElements('[data-frameflow-frame]');

    // and turn them into an array of Frame instances
    this.frameElements.each(function(frameElement){
      this.frames.include(new FrameFlow.Frame(frameElement));
    }, this);

  },

  attach: function(_detach){
    if (!this.boundEvents){
      this.boundEvents = {
        next: this.next.bind(this),
        previous: this.previous.bind(this),
        target: this.getTarget.bind(this)
      };
    }
    var eventMethod = _detach || 'addEvents';
    this.element[eventMethod]({
      'click:relay([data-frameflow-previous])': this.boundEvents.previous,
      'click:relay([data-frameflow-next])': this.boundEvents.next,
      'click:relay([data-frameflow-target])': this.boundEvents.target
    });
  },

  detach: function(){
    this.attach('removeEvents');
  },

  getFrameIndexBySelector: function(selector){
    var foundIndex;
    this.frameElements.some(function(frameElement, index){
      if (frameElement.match(selector)){
        foundIndex = index;
        return true;
      }
      return false;
    });

    return foundIndex;
  },

  next: function(){
    // goes to the next frame in array order
    if (this.currentIndex + 1 == this.frames.length) return;
    this.transition(this.currentIndex + 1);
  },

  previous: function(){
    // goes back to the last active frame, not back 1

    if (this.currentIndex - 1 < 0) return;

    var lastActiveIndex = 0;
    this.frames.slice(0, this.currentIndex).each(function(frame, index){
      if (frame.active) lastActiveIndex = index;
    });

    this.transition(lastActiveIndex);
  },

  getTarget: function(event, element){
    var targetSelector = element.getData('frameflow-target');
    var targetIndex = this.getFrameIndexBySelector(targetSelector);
    this.transition(targetIndex);
  },

  transition: function(index){
    if (index == this.currentIndex) return;
    if (index > this.currentIndex){
      this.frames[this.currentIndex].addState('exitState');
      this.frames[index].addState('activeState');
    } else {
      this.frames[this.currentIndex].removeState('activeState');
      this.frames[index].removeState('exitState');
    }
    this.currentIndex = index;
  }

});

FrameFlow.Frame = new Class({
  active: false,
  exited: false,
  initialize: function(element){
    this.element = element;
    var data = element.getJSONData('frameflow-frame');
    // if anything goes wrong in parsing the JSON (with getJSONData, above), it
    // returns a string. so we check the type of data to see if it's a string.
    // if it is, there was a parsing error, so print an error
    if (typeof data == 'string'){
      if (window.console && console.error){
        console.error('Error parsing frame data for', element);
      }
    } else {
      this.activeState = data.activeState || {};
      this.exitState = data.exitState || {};
    }
  },

  addState: function(state){
    if (state == 'activeState') this.active = true;
    if (state == 'exitState') this.exited = true;
    this.changeState(state);
  },

  removeState: function(state){
    if (state == 'activeState') this.active = false;
    if (state == 'exitState') this.exited = false;
    this.changeState(state, 'removeClass');
  },

  changeState: function(state, changeType){
    if (this.activeState && this.exitState){
      changeType = changeType || 'addClass';
      Object.keys(this[state]).each(function(selector){
        var el = $$(selector);
        this[state][selector].classes.each(function(klass){
          el[changeType](klass);
        });
      }, this);
    }
  }


});
