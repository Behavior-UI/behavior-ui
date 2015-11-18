/*
---

name: Bootstrap.Form.Validator.Tips

description: Form Validation with Bootstrap Tips

requires:
 - More/Form.Validator.Inline
 - Bootstrap.Tooltip

provides: [Bootstrap.Form.Validator.Tips]

...
*/

Bootstrap.Form = Bootstrap.Form || {};
Bootstrap.Form.Validator = Bootstrap.Form.Validator || {};
Bootstrap.Form.Validator.Tips = new Class({
  Extends: Form.Validator.Inline,
  options: {
    serial: true,
    tooltipOptions: {
      location: 'right'
    }
  },
  showAdvice: function(className, field){
    // getAdvice returns the tooltip instance
    var advice = this.getAdvice(field);
    // show it
    if (advice) advice.show();
    this.fireEvent('showAdvice', [field, advice, className]);
  },
  hideAdvice: function(className, field){
    // getAdvice returns the tooltip instance
    var advice = this.getAdvice(field);
    // assuming it's been built and the message for the specified className is present
    if (advice && advice.visible && advice.msgs && advice.msgs[className]){
      // hide that specific message
      advice.msgs[className].hide();
      // check if any visible messages remain and, if not, hide the tip
      if (!Object.some(advice.msgs, function(el){ return el.isVisible(); })) advice.hide();
      this.fireEvent('hideAdvice', [field, advice, className]);
    }
  },
  // returns the tooltip
  getAdvice: function(className, field){
    // the arguments to this method are mutable, sometimes just one, the other, or both, so
    // we get the element by type
    var params = Array.link(arguments, {field: Type.isElement});
    // retrieve the tooltip instance
    return params.field.retrieve('Bootstrap.Tooltip');
  },
  advices: [],
  makeAdvice: function(className, field, error, warn){
    // if we aren't in an error state, just exit
    if (!error && !warn) return;
    // get the tooltip
    var advice = field.retrieve('Bootstrap.Tooltip');
    // no tooltip? let's create
    if (!advice){
      // a list item to hold messages
      var msg = new Element('ul', {
        styles: {
          margin: 0,
          padding: 0,
          listStyle: 'none'
        }
      });
      // make advice for this specific message and put into our list
      var li = this.makeAdviceItem(className, field);
      if (li) msg.adopt(li);
      // store our list element
      field.store('validationMsgs', msg);

      // get the offset per input
      var offset = field.get('data-tip-offset');
      if (offset){
        if (Number.from(offset)){
          offset = Number.from(offset);
        } else {
          if (offset.substring(0,1) != '{') offset = '{' + offset + '}';
          offset = JSON.decode(offset);
        }
      }

      // store the title in case we're using titles in the options
      field.store('title', field.get('title'));

      var tipTarget = this.options.tooltipOptions.inject ?
                      this.options.tooltipOptions.inject.target || this.getScrollParent(this.element) :
                      this.getScrollParent(this.element);

      // our instance of Bootstrap.Tooltip
      advice = new Bootstrap.Tooltip(field,
        Object.merge({}, this.options.tooltipOptions, {
          inject: {
            target: tipTarget
          },
          // don't show on mouseover, only when we invoke .show
          trigger: 'manual',
          location: field.get('data-tip-location') || this.options.tooltipOptions.location,
          offset: offset,
          getContent: function(){
            return '';
          }
        })
      );
      // we need the class to create its DOM elements now, even if we aren't ready to show
      advice._makeTip();
      // so we can put our messages holder in it
      advice.tip.getElement('.tooltip-inner').adopt(msg);
      advice.tip.addClass('validation-tooltip');
      if (this.options.extraClass) advice.tip.addClass(this.options.extraClass);
      // store our tooltip instance
      this.advices.push(advice);
      // placeholder for specific validation messages per popup
      advice.msgs = {};
      // store our tooltip instance on the field
      field.store('Bootstrap.Tooltip', advice);
    }
    // this is a convention from the parent class
    field.store('advice-'+className, advice);
    // now we insert our validation message
    this.appendAdvice(className, field, error, warn);
    // show the tooltip
    advice.show();
    return advice;
  },
  validateField: function(field, force){
    // get the popup
    var advice = this.getAdvice(field);
    // are any visible?
    var anyVis = this.advices.some(function(a){ return a.visible; });
    // if any are and options.serial is true
    if (anyVis && this.options.serial && advice){
      // then we only want to run validations on this field
      // if this is the one that's got a message visible already
      var passed;
      if (advice && advice.visible){
        passed = this.parent(field, force);
        // otherwise we force hide the tip
        if (!field.hasClass('validation-failed')) advice.hide();
      }
      // and exit
      return passed;
    }
    // get the messages for the field
    var msgs = field.retrieve('validationMsgs');
    // hide all the messages in it (the list items)
    if (msgs) msgs.getChildren().hide();
    // if the field has an error state, show the advice
    if ((field.hasClass('validation-failed') || field.hasClass('warning')) && advice) advice.show();
    // if we're doing the serial thing
    if (this.options.serial){
      // get any other fields that have an error state
      var fields = this.element.getElements(this.options.fieldSelectors).filter('.validation-failed, .warning');
      if (fields.length){
        // do not hide advice for first field
        fields.shift();
        // but hide advices for other fields
        fields.each(function(f){
          var adv = this.getAdvice(f);
          if (adv) adv.hide();
        }, this);
      }
    }
    return this.parent(field, force);
  },
  getScrollParent: function(element){
    var par = element.getParent();
    while (par != document.body && par.getScrollSize().y == par.getSize().y){
      par = par.getParent();
    }
    return par;
  },
  makeAdviceItem: function(className, field, error, warn){
    // if there's no error, there's no advice
    if (!error && !warn) return;
    // get the tooltip
    var advice = this.getAdvice(field);
    // get the message
    var errorMsg = this.makeAdviceMsg(field, error, warn);
    // if there's already an element for this validator, just update it and return it
    // if we're using titles, we only create one validation message (with the title of the input)
    // so use 'title' for the key for all inputs.
    if (this.options.useTitles) className = 'title';
    if (advice && advice.msgs[className]) return advice.msgs[className].set('html', errorMsg);
    // otherwise create a new one and return it
    var li = new Element('li', {
      html: errorMsg,
      style: {
        display: 'none'
      }
    });
    // store the reference
    advice.msgs[className] = li;
    return li;
  },
  makeAdviceMsg: function(field, error, warn){
    // get our prefix, append our message using the element title if that option is set or the error message
    // returned from the validator
    var errorMsg = (warn) ? this.warningPrefix : this.errorPrefix;
      errorMsg += (this.options.useTitles) ? field.retrieve('title') || error : error;
    return errorMsg;
  },
  appendAdvice: function(className, field, error, warn){
    // get our tooltip
    var advice = this.getAdvice(field);
    // if there's a DOM element for this validator, update it and show it
    if (advice.msgs[className]) return advice.msgs[className].set('html', this.makeAdviceMsg(field, error, warn)).show();
    // otherwise make a new one
    var li = this.makeAdviceItem(className, field, error, warn);
    // if there wasn't anything returned (i.e. no error state) exit
    if (!li) return;
    // otherwise inject the list item into the UL and show it
    li.inject(field.retrieve('validationMsgs')).show();
  },
  // the tooltip has its own insertion logic invoked when you call .show, so we turn this method into a stub
  insertAdvice: function(advice, field){}
});
