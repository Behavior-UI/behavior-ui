/*
---

name: FlatUI.Select

description: FlatUI Select styling.

requires:
 - Core/Element.Event
 - Core/Element.Style
 - More/Fx.Scroll
 - FlatUI


provides: [FlatUI.Select]

...
*/


FlatUI.Select = new Class({

  Implements: [Options, Events],

  options: {
    // menuClass: '',
    buttonClass: 'btn-primary',
    noneSelectedText : 'Nothing selected',
    arrowClass: 'dropdown-arrow',
    closeOnEsc: true
  },

  initialize: function(element, options){
    this.select = document.id(element);
    this.select.store('select', this);
    this.setOptions(options);
    // store whether or not we're doing multi-select
    this.multiple = this.options.multiple || !!this.select.get('multiple');
    // bound functions for events
    this.bound = {
      show: this.show.bind(this),
      bodyClickHandler: function(e){
        if (e.target != this.element && !this.element.contains(e.target)){
          this.hide();
          this.disableKeys();
        }
      }.bind(this),
      keyMonitor: function(e){
        if (e.key == 'esc') this.hide();
      }.bind(this),
      focus: this.focus.bind(this),
      checkFocus: this.checkFocus.bind(this)
    };
    // build the UI
    this.build();
    // attach events
    this.attach();
    // disable if needed
    if (this.select.get('disabled')) this.disable();
    // hide the original select element
    this.select.setStyle('display', 'none');
  },

  build: function(){
    // get the classes from the select element and transfer them to our HTML UI
    var elementClasses = this.select.get('class') ? this.select.get('class').split(' ') : [];
    var classes = elementClasses.erase('selectpicker').combine(['btn-group','select']);
    // the container for the HTML UI
    this.element = new Element('div.' + classes.join('.')).inject(this.select, 'after');
    // The button the user clicks to interact
    this.button = new Element('button.btn.dropdown-toggle.clearfix', {
      html: "<span class='filter-option pull-left'></span>&nbsp;" +
            "<span class='caret'></span>",
      events: {
        click: function(e){
          /*
            When you hit enter in a form input, the browser finds the nearest button and
            calls its click event. The event passed to it is even marked as being a click.
            The only way to tell that it wasn't a click is that there are no coords for
            it. So I check if the input has x and y values and if it does, I treat it
            like a mouse event, otherwise, the keyboard.
          */
          if (e.page.x && e.page.y) this.show(e);
        }.bind(this),
        focus: this.bound.focus
      }
    }).addClass(this.options.buttonClass || '').inject(this.element);
    new Element('i.dropdown-arrow').inject(this.element).addClass(this.options.arrowClass || '');
    // the element that shows the selected values
    this.filterOption = this.button.getElement('.filter-option');
    // the list of options to click
    this.list = new Element('ul.dropdown-menu.full-width').addClass(this.options.menuClass || '').inject(this.element);
    // build the options for the list
    this.buildOptions();
    // update the button to show what's selected now
    this.updateButton();
  },

  // attaches event handlers to our dom elements
  attach: function(_detach){
    var method = _detach ? 'removeEvent' : 'addEvent';
    // if this element has an id
    var id = this.select.get('id');
    // add an event listener for labels to select it
    if (id) document[method]('click:relay(label[for="' + id + '"])', this.bound.show);
    // monitor for click-out to hide it
    document[method]('click', this.bound.bodyClickHandler);
    // close when the user hits esc
    if (this.options.closeOnEsc) document[method]('keyup', this.bound.keyMonitor);
  },

  // detach and destroy; restore original input
  destroy: function(){
    this.attach(true);
    this.element.destroy();
    this.select.setStyle('display', '');
  },

  // disable the UI
  disable: function(){
    this.disabled = true;
    this.button.addClass('disabled');
  },

  // enable the UI
  enable: function(){
    this.disabled = false;
    this.button.removeClass('disabled');
  },

  buildOptions: function(){
    // empty the list
    this.list.empty();
    // get the elements and option groups
    this.select.getElements('> optgroup, > option').map(function(opt, i){
      // if it's an option group
      if (opt.get('tag') == 'optgroup'){
        // get all the options in the option group
        var options = opt.getElements('option');
        // drop the first as makeOptGroupItem uses the first one
        options.shift();

        // great the option gropu header which needs the first option
        var optGroup = this.makeOptGroupItem(opt);
        // if we're not on the first item, drop in a divider
        if (i > 0) new Element('div.divider').inject(optGroup, 'top');
        // inject it into the list
        this.list.adopt(optGroup);
        // go through the remaining options in the group and drop them into the list
        options.each(function(option){
          this.list.adopt(this.makeOptionItem(option, 'opt'));
        }, this);
      } else {
        // otherwise it's an option, drop it in the list.
        this.list.adopt(this.makeOptionItem(opt));
      }
    }, this);
  },

  // updates the button w/ the text of the selected elements.
  updateButton: function(){
    this.filterOption.set('html', this.select.getSelected().map(this.getOptionText, this).join(', ') || this.options.noneSelectedText);
  },

  // makes a group item
  makeOptGroupItem: function(optGroup){
    // grab the first option
    var firstOption = optGroup.getElement('option');
    // create our list item
    var item = new Element('li', {
      'class': firstOption.get('selected') ? 'selected' : ''
    }).adopt(
      // the group header
      new Element('dt', {
        html: optGroup.get('label')
      })
    );
    if (firstOption){
      item.adopt(
        // the option itself
        this.makeOptionLink(firstOption, 'opt')
      );
      firstOption.store('select.item', item);
    }
    return item;
  },

  // make a regular option item for the list
  makeOptionItem: function(option, itemClass, linkClass){
    // the list item
    var item = new Element('li', {
      // the class is the itemClass from the args, selected if the
      // option is selected, disabled if the option disabled
      'class': (itemClass || '') +
               (option.get('selected') ? ' selected': '') +
               (option.hasClass('disabled') || option.get('disabled') ? 'disabled' : '')
    }).adopt(
      // inject the link into the list item
      this.makeOptionLink(option, linkClass)
    );
    option.store('select.item', item);
    return item;
  },

  // makes the link for the option
  makeOptionLink: function(option, linkClass){
    // the link
    var link = new Element('a', {
      // no tab index for you
      tabindex: -1,
      // class is the linkClass from args, selected if option is selected, plus any class on the option itself
      'class': [(linkClass || ''), (option.get('selected') ? ' active' : ''), option.get('class')].join(' '),
      events: {
        // when you click it, select unless the option is disabled
        click: function(e){
          e.stop();
          if (!link.hasClass('disabled')) this.selectOption(option, e);
        }.bind(this)
      }
    }).adopt(
      // the text of the option
      new Element('span.pull-left', {
        html: this.getOptionText(option)
      })
    );
    // add disabled class if the option is disabled
    if (option.get('disabled')) link.addClass('disabled');
    option.store('select.link', link);
    return link;
  },

  // gets the text of an option; if no text found, uses value
  getOptionText: function(option){
    return option.get('text') === null ? option.get('value') : option.get('text');
  },

  // removes selected state from all HTML UI elements
  reset: function(){
    this.element.getElements('.selected').removeClass('selected');
    this.element.getElements('.active').removeClass('active');
  },

  // selects an option - argument here is the option in the original select list
  selectOption: function(option, e){
    // are we doing multiple here? then toggle
    var select = this.multiple ? !option.get('selected') : true;
    // if we're selecting, we're adding the classes, otherwise remove
    var action = select ? 'addClass' : 'removeClass';
    // if we're not doing multiple, deselect everything else
    if (!this.multiple) this.reset();
    // get the link and add the active class
    option.retrieve('select.link')[action]('active');
    // get the list item and add the selected class
    option.retrieve('select.item')[action]('selected');
    // set the original option's selected state so we can submit it
    option.set('selected', select);
    this.select.fireEvent('change', e);
    // fire an event for this action
    this.fireEvent(select ? 'select' : 'deselect', [option, e]);
    // update the button state to show what's selected
    this.updateButton();
    // if we're not doing multiple, hide it
    if (!this.multiple){
      this.hide();
      this.button.focus();
    }
  },

  // shows the dropdown
  show: function(e){
    if (e) e.preventDefault();
    if (this.disabled || this.open) return;
    this.button.focus();
    this.element.addClass('open');
    this.scrollTo();
    this.open = true;
    this.enableKeys();
    this.fireEvent('show');
  },

  focus: function(e){
    this.enableKeys();
  },

  checkFocus: function(e){
    if (!this.element.contains(e.target)) this.disableKeys();
  },

  scrollTo: function(option){
    option = option || this.element.getElements('.selected')[0];
    if (!option) return;
    if (!this.fx) this.fx = new Fx.Scroll(this.list, {duration: 0, offset: {y: -50}});
    this.fx.toElement(option);
  },

  // hides the dropdown
  hide: function(){
    this.element.removeClass('open');
    this.open = false;
    this.fireEvent('hide');
  },

  enableKeys: function(){
    if (this.keysOn) return;
    if (!this.bound.interaction){
      this.bound.keystopper = function(e){
        switch(e.key){
          case 'up':
          case 'down':
          case 'enter':
            e.stop();
            break;
        }
      };
      this.bound.interaction = function(e){
        switch(e.key){
          case 'up':
            this.up();
            break;
          case 'down':
            this.down();
            break;
          case 'enter':
            this.enter(e);
            break;
          case 'tab':
            if (!this.element.contains(e.target)){
              this.hide();
              this.disableKeys();
            }
            break;
        }
      }.bind(this);
    }

    document.addEvent('relay:focus(*)', this.bound.checkFocus);
    document.addEvent('keyup', this.bound.interaction);
    document.addEvent('keydown', this.bound.keystopper);
    this.keysOn = true;
  },

  disableKeys: function(){
    if (!this.keysOn) return;
    document.removeEvent('relay:focus(*)', this.bound.checkFocus);
    document.removeEvent('keyup', this.bound.interaction);
    document.removeEvent('keydown', this.bound.keystopper);
    this.keysOn = false;
  },

  getFocused: function(){
    if (this.focused === undefined){
      this.focused = this.select.getElements('option')
                         .indexOf(this.select.getSelected()[0]);
    }
    if (this.focused == -1) this.focused = 0;
    return this.focused;
  },

  up: function(){
    this.show();
    this.getFocused();
    if (this.focused === 0) return;
    this.focused = this.focused - 1;
    var option = this.list.getElements('li > a')[this.focused];
    option.focus();
    this.scrollTo(option);
  },

  down: function(){
    var open = this.open;
    this.show();
    this.getFocused();
    if (this.focused == this.select.getElements('option').length - 1) return;
    this.focused = this.focused + 1;
    var option = this.list.getElements('li > a')[this.focused];

    if (!open){
      // if it's not open yet, some browsers (*cough*Chrome*cough*) don't focuse
      // the option beause of the transition in showing, so we delay the first one.
      (function(){
        option.focus();
      }).delay(20);
    } else {
      option.focus();
    }

    this.scrollTo(option);
  },

  enter: function(e){
    if (this.focused !== undefined && this.open){
      this.selectOption(this.select.getElements('option')[this.focused], e);
    }
  }

});
