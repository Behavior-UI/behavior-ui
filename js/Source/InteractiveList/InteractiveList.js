/*
---

name: InteractiveList

description: Able to mark selected list members with a class and can optionally scroll that member to the top of the list

requires:
 - More/Fx.Scroll
 - Core/Element.Delegation
 - Swipe

provides: [InteractiveList]

...
*/

InteractiveList = new Class({
  Implements: [Options, Events],
  options: {
    selectedClass: 'selected',
    listItems: 'li',
    autoScroll: true,
    scrollAxes: null,
    firstItemSelected: false,
    // scrolls to the item when clicked even if it's already been scrolled to
    doubleScroll: true,
    scrollType: 'toElement',
    swipeToNext: false
  },
  // currentlySelected: null,
  initialize: function(listElement, options){
    this.element = document.id(listElement);
    this.scroll = new Fx.Scroll(this.element);
    this.setOptions(options);
    this.bound = {};
    if (this.options.swipeToNext){
      this.bound.swipeHandler = function(e){
        this.fireEvent('interaction', 'swipe');
        if (e.direction == 'left') this.next(e);
        else if (e.direction == 'right') this.back(e);
      }.bind(this);
    }
    this.attach();
  },
  clickHandler: function(event, clickedElement){
    this.select(clickedElement, event);
  },
  attach: function(){
    this.element.addEvent('click:relay('+this.options.listItems+')', this.clickHandler.bind(this));
    if (this.options.firstItemSelected) this.select(this.getListItems()[0]);
    if (this.options.swipeToNext) this.element.addEvent('swipe', this.bound.swipeHandler);
  },
  getListItems: function(){
    return this.element.getElements(this.options.listItems);
  },
  select: function(selectedElement, event){
    // marks li as selected
    if (!this.disabled){
      this.reset();
      if (this.options.autoScroll && (this.options.doubleScroll || this.currentlySelected != selectedElement)){
        this.scroll[this.options.scrollType](selectedElement, this.options.scrollAxes);
      }
      this.currentlySelected = selectedElement;
      selectedElement.addClass(this.options.selectedClass);
    }
    this.fireEvent('select', [selectedElement, event]);
  },
  next: function(e){
    var listItems = this.getListItems();
    var selectedIndex = listItems.indexOf(this.currentlySelected);
    if (selectedIndex != listItems.length-1) this.select(listItems[selectedIndex+1]);
  },
  back: function(e){
    var listItems = this.getListItems();
    var selectedIndex = listItems.indexOf(this.currentlySelected);
    if (selectedIndex !== 0) this.select(listItems[selectedIndex-1]);
  },
  disable: function(){
    this.disabled = true;
  },
  enable: function(){
    this.disabled = false;
  },
  reset: function(){
    if (this.currentlySelected) this.currentlySelected.removeClass(this.options.selectedClass);
  }
});