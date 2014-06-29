/*
---
name: Autocompleter

description: An auto completer class from <a href=\"http://digitarald.de\">http://digitarald.de</a>.

version: 1.1.1

license: MIT-style license

author: Harald Kirschner <mail [at] digitarald.de>

copyright: Author

requires: [Core/Fx.Tween, More/Element.Forms, More/Element.Position, Autocompleter.Observer]

provides: [Autocompleter, Autocompleter.Base]

...
*/
var Autocompleter = {};

Autocompleter.Base = new Class({

  Implements: [Options, Events],

  options: {
    minLength: 1,
    markQuery: true,
    width: 'inherit',
    maxChoices: 10,
//    injectChoice: null,
//    customChoices: null,
    className: 'autocompleter-choices',
    zIndex: 42,
    delay: 400,
    observerOptions: {},
    fxOptions: {},
//    onSelection: function(){},
//    onShow: function(){},
//    onHide: function(){},
//    onBlur: function(){},
//    onFocus: function(){},
//    onChoiceConfirm: function(){},

    autoSubmit: false,
    overflow: false,
    overflowMargin: 25,
    selectFirst: false,
    filter: null,
    filterCase: false,
    filterSubset: false,
    forceSelect: false,
    selectMode: true,
    choicesMatch: null,

    multiple: false,
    separator: ', ',
    autoTrim: true,
    allowDupes: false,

    cache: true,
    relative: false
  },

  initialize: function(element, options){
    this.element = document.id(element);
    this.setOptions(options);
    this.options.separatorSplit = new RegExp("\s*["+
      this.options.separator == " " ? " " : this.options.separator.trim()+
      "]\s*/");
    this.build();
    this.observer = new Observer(this.element, this.prefetch.bind(this), Object.merge({
      'delay': this.options.delay
    }, this.options.observerOptions));
    this.queryValue = null;
    if (this.options.filter) this.filter = this.options.filter.bind(this);
    var mode = this.options.selectMode;
    this.typeAhead = (mode == 'type-ahead');
    this.selectMode = (mode === true) ? 'selection' : mode;
    this.cached = [];
  },

  /**
   * build - Initialize DOM
   *
   * Builds the html structure for choices and appends the events to the element.
   * Override this function to modify the html generation.
   */
  build: function(){
    if (document.id(this.options.customChoices)){
      this.choices = this.options.customChoices;
    } else {
      this.choices = new Element('ul', {
        'class': this.options.className,
        'styles': {
          'zIndex': this.options.zIndex
        }
      }).inject(document.body);
      this.relative = false;
      if (this.options.relative || this.element.getOffsetParent() != document.body){
        this.choices.inject(this.element, 'after');
        this.relative = this.element.getOffsetParent();
      }
    }
    if (!this.options.separator.test(this.options.separatorSplit)){
      this.options.separatorSplit = this.options.separator;
    }
    this.fx = (!this.options.fxOptions) ? null : new Fx.Tween(this.choices, Object.merge({
      'property': 'opacity',
      'link': 'cancel',
      'duration': 200
    }, this.options.fxOptions)).addEvent('onStart', Chain.prototype.clearChain).set(0);
    this.element.setProperty('autocomplete', 'off')
      .addEvent((Browser.ie || Browser.chrome || Browser.safari) ? 'keydown' : 'keypress', this.onCommand.bind(this))
      .addEvent('click', this.onCommand.bind(this, false))
      .addEvent('focus', function(){
        this.toggleFocus.delay(100, this, [true]);
      }.bind(this));
      //.addEvent('blur', this.toggleFocus.create({bind: this, arguments: false, delay: 100}));
    document.addEvent('click', function(e){
      if (e.target != this.choices) this.toggleFocus(false);
    }.bind(this));
  },

  destroy: function(){
    this.choices = this.selected = this.choices.destroy();
  },

  toggleFocus: function(state){
    this.focussed = state;
    if (!state) this.hideChoices(true);
    this.fireEvent((state) ? 'onFocus' : 'onBlur', [this.element]);
  },

  onCommand: function(e){
    if (!e && this.focussed) return this.prefetch();
    if (e && e.key && !e.shift){
      switch (e.key){
        case 'enter': case 'tab':
          if (this.element.value != this.opted) return true;
          if (this.selected && this.visible){
            this.choiceSelect(this.selected);
            this.fireEvent('choiceConfirm', this.selected);
            return !!(this.options.autoSubmit);
          }
          break;
        case 'up': case 'down':
          if (!this.prefetch() && this.queryValue !== null){
            var up = (e.key == 'up');
            this.choiceOver((this.selected || this.choices)[
              (this.selected) ? ((up) ? 'getPrevious' : 'getNext') : ((up) ? 'getLast' : 'getFirst')
            ](this.options.choicesMatch), true);
          }
          return false;
        case 'esc':
          this.hideChoices(true);
          break;
      }
    }
    return true;
  },

  setSelection: function(finish){
    var input = this.selected.inputValue, value = input;
    var start = this.queryValue.length, end = input.length;
    if (input.substr(0, start).toLowerCase() != this.queryValue.toLowerCase()) start = 0;
    if (this.options.multiple){
      var split = this.options.separatorSplit;
      value = this.element.value;
      start += this.queryIndex;
      end += this.queryIndex;
      var old = value.substr(this.queryIndex).split(split, 1)[0];
      value = value.substr(0, this.queryIndex) + input + value.substr(this.queryIndex + old.length);
      if (finish){
        var space = /[^\s,]+/;
        var tokens = value.split(this.options.separatorSplit).filter(space.test, space);
        if (!this.options.allowDupes) tokens = [].combine(tokens);
        var sep = this.options.separator;
        value = tokens.join(sep) + sep;
        end = value.length;
      }
    }
    this.observer.setValue(value);
    this.opted = value;
    if (finish || this.selectMode == 'pick') start = end;
    this.element.selectRange(start, end);
    this.fireEvent('onSelection', [this.element, this.selected, value, input]);
  },

  showChoices: function(){
    var match = this.options.choicesMatch, first = this.choices.getFirst(match);
    this.selected = this.selectedValue = null;
    if (!first) return;
    if (!this.visible){
      this.visible = true;
      this.choices.setStyle('display', '');
      if (this.fx) this.fx.start(1);
      this.fireEvent('onShow', [this.element, this.choices]);
    }
    if (this.options.selectFirst || this.typeAhead || first.inputValue == this.queryValue) this.choiceOver(first, this.typeAhead);
    var items = this.choices.getChildren(match), max = this.options.maxChoices;
    var styles = {'overflowY': 'hidden', 'height': ''};
    this.overflown = false;
    if (items.length > max){
      var item = items[max - 1];
      styles.overflowY = 'scroll';
      styles.height = item.getCoordinates(this.choices).bottom;
      this.overflown = true;
    };
    this.choices.setStyles(styles);
  },

  hideChoices: function(clear){
    if (clear){
      var value = this.element.value;
      if (this.options.forceSelect) value = this.opted;
      if (this.options.autoTrim){
        value = value.split(this.options.separatorSplit).filter(function(){ return arguments[0]; }).join(this.options.separator);
      }
      this.observer.setValue(value);
    }
    if (!this.visible) return;
    this.visible = false;
    this.observer.clear();
    var hide = function(){
      this.choices.setStyle('display', 'none');
    }.bind(this);
    if (this.fx) this.fx.start(0).chain(hide);
    else hide();
    this.fireEvent('onHide', [this.element, this.choices]);
  },

  prefetch: function(){
    var value = this.element.value, query = value;
    if (this.options.multiple){
      var split = this.options.separatorSplit;
      var values = value.split(split);
      var index = this.element.getCaretPosition();
      var toIndex = value.substr(0, index).split(split);
      var last = toIndex.length - 1;
      index -= toIndex[last].length;
      query = values[last];
    }
    if (query.length < this.options.minLength){
      this.hideChoices();
    } else {
      if (query === this.queryValue || (this.visible && query == this.selectedValue)){
        if (this.visible) return false;
        this.showChoices();
      } else {
        this.queryValue = query;
        this.queryIndex = index;
        if (!this.fetchCached()) this.query();
      }
    }
    return true;
  },

  fetchCached: function(){
    if (!this.options.cache
      || !this.cached
      || !this.cached.length
      || this.cached.length >= this.options.maxChoices
      || this.queryValue) return false;
    this.update(this.filter(this.cached));
    return true;
  },

  update: function(tokens){
    this.choices.empty();
    this.cached = tokens;
    if (!tokens || !tokens.length){
      this.hideChoices();
    } else {
      if (this.options.maxChoices < tokens.length && !this.options.overflow) tokens.length = this.options.maxChoices;
      tokens.each(this.options.injectChoice || function(token){
        var choice = new Element('li', {'html': this.markQueryValue(token)});
        choice.inputValue = token;
        this.addChoiceEvents(choice).inject(this.choices);
      }, this);
      this.showChoices();
    }
  },

  choiceOver: function(choice, selection){
    if (!choice || choice == this.selected) return;
    if (this.selected) this.selected.removeClass('autocompleter-selected');
    this.selected = choice.addClass('autocompleter-selected');
    this.fireEvent('onSelect', [this.element, this.selected, selection]);
    if (!selection) return;
    this.selectedValue = this.selected.inputValue;
    if (this.overflown){
      var coords = this.selected.getCoordinates(this.choices), margin = this.options.overflowMargin,
        top = this.choices.scrollTop, height = this.choices.offsetHeight, bottom = top + height;
      if (coords.top - margin < top && top) this.choices.scrollTop = Math.max(coords.top - margin, 0);
      else if (coords.bottom + margin > bottom) this.choices.scrollTop = Math.min(coords.bottom - height + margin, bottom);
    }
    if (this.selectMode) this.setSelection();
  },

  choiceSelect: function(choice){
    if (choice) this.choiceOver(choice);
    this.setSelection(true);
    this.queryValue = false;
    this.hideChoices();
  },

  filter: function(tokens){
    return (tokens || this.tokens).filter(function(token){
      return this.test(token);
    }, new RegExp(((this.options.filterSubset) ? '' : '^') + this.queryValue.escapeRegExp(), (this.options.filterCase) ? '' : 'i'));
  },

  /**
   * markQueryValue
   *
   * Marks the queried word in the given string with <span class="autocompleter-queried">*</span>
   * Call this i.e. from your custom parseChoices, same for addChoiceEvents
   *
   * @param    {String} Text
   * @return    {String} Text
   */
  markQueryValue: function(str){
    if (!this.options.markQuery || !this.queryValue) return str;
    var regex = new RegExp('(' + ((this.options.filterSubset) ? '' : '^') + this.queryValue.escapeRegExp() + ')', (this.options.filterCase) ? '' : 'i');
    return str.replace(regex, '<span class="autocompleter-queried">$1</span>');
  },

  /**
   * addChoiceEvents
   *
   * Appends the needed event handlers for a choice-entry to the given element.
   *
   * @param    {Element} Choice entry
   * @return    {Element} Choice entry
   */
  addChoiceEvents: function(el){
    return el.addEvents({
      'mouseover': this.choiceOver.bind(this, el),
      'click': function(){
        var result = this.choiceSelect(el);
        this.fireEvent('choiceConfirm', this.selected);
        return result;
      }.bind(this)
    });
  }
});
