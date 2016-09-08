/*
---

name: FlatUI.Select.Filter

description: Filter input for FlatUI Select components.

requires:
 - FlatUI.Select
 - Form.Filter


provides: [FlatUI.Select.Filter]

...
*/


FlatUI.Select.Filter = new Class({

  Extends: FlatUI.Select,

  options: {
    containerClass: '.form-group.no-margin.padding-small'
  },

  build: function(){
    this.parent.apply(this, arguments);
    // build the DOM elements for our filter, inject them into the list UI
    this.filterLi = new Element('li.filter').inject(this.list, 'top');
    this.filterInput = new Element('input.form-control[placeholder=search]');
    new Element('div' + this.options.containerClass).adopt(
      this.filterInput
    ).inject(this.filterLi);

    // create an instance of our Form.Filter
    this.formFilter = new Form.Filter(this.filterInput, {
      items: '!ul li.flat-ui-select-li',
      text: 'span'
    });
  },

  destroy: function(){
    this.parent.apply(this, arguments);
    this.formFilter.detach();
  },

  reset: function(){
    this.parent.apply(this, arguments);
    // reset the filter, too
    this.filterInput.set('value', '');
    this.formFilter.filter();
  },

  show: function(e){
    if (this.disabled || this.open) return;
    this.parent.apply(this, arguments);
    // on show, select the filter input, so the user can just start typing
    // delay is required because of the transition
    this.filterInput.select.delay(300, this.filterInput);
  },

  // we mark items for the select with a class so the filter only
  // filters them and not the list item used by the filter's input
  makeOptGroupItem: function(){
    return this.parent.apply(this, arguments).addClass('flat-ui-select-li');
  },

  makeOptionItem: function(){
    return this.parent.apply(this, arguments).addClass('flat-ui-select-li');
  },

  isVisible: function(item){
    return !item.hasClass('hide');
  },

  // if the user hits up (or down) we have to check if the newly selected
  // input is visible and, if not, repeat the step until we either get to the
  // top or find one that's visible. This is because the user may have filtered
  // out the input above the one they currently have selected, effectively selecting
  // a value they cannot see
  up: function(){
    this.parent.apply(this, arguments);
    var items = this.list.getElements('li.flat-ui-select-li');
    if (!this.isVisible(items[this.focused]) && this.focused !== 0) this.up();
  },

  down: function(){
    this.parent.apply(this, arguments);
    var items = this.list.getElements('li.flat-ui-select-li');
    if (!this.isVisible(items[this.focused]) && this.focused !== items.length - 1) this.down();
  },

});
