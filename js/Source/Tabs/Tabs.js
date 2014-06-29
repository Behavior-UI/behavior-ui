/*
---

name: Tabs

description: Handles the scripting for a common UI layout; the tabbed box.

license: MIT-Style License

requires:
 - Core/Element.Event
 - Core/Fx.Tween
 - Core/Fx.Morph
 - Core/Element.Dimensions
 - Core/Cookie
 - More/Element.Shortcuts
 - More/Element.Measure

provides: Tabs

...
*/
var Tabs = new Class({
  Implements: [Options, Events],
  options: {
    // initPanel: null,
    // smooth: false,
    // smoothSize: false,
    // maxSize: null,
    // onActive: function(){},
    // onActiveAfterFx: function(){},
    // onBackground: function(){}
    // cookieName: null,
    preventDefault: true,
    selectedClass: 'tabSelected',
    mouseoverClass: 'tabOver',
    deselectedClass: '',
    rearrangeDOM: true,
    effectOptions: {
      duration: 500
    },
    cookieDays: 999
  },
  tabs: [],
  sections: [],
  clickers: [],
  sectionFx: [],
  initialize: function(options){
    this.setOptions(options);
    if (this.options.selectedClass) this.options.selectedClass = this.options.selectedClass.trim();
    if (this.options.deselectedClass) this.options.deselectedClass = this.options.deselectedClass.trim();
    var prev = this.setup();
    if (prev) return prev;
    if (this.options.initPanel != null) this.show(this.options.initPanel);
    else if (this.options.cookieName && this.recall()) this.show(this.recall().toInt());
    else this.show(0);

  },
  setup: function(){
    var opt = this.options,
        sections = $$(opt.sections),
        tabs = $$(opt.tabs);
    if (tabs[0] && tabs[0].retrieve('Tabs')) return tabs[0].retrieve('Tabs');
    var clickers = $$(opt.clickers);
    tabs.each(function(tab, index){
      this.addTab(tab, sections[index], clickers[index], index);
    }, this);
  },
  addTab: function(tab, section, clicker, index){
    tab = document.id(tab); clicker = document.id(clicker); section = document.id(section);
    //if the tab is already in the interface, just move it
    if (this.tabs.indexOf(tab) >= 0 && tab.retrieve('tabbered')
       && this.tabs.indexOf(tab) != index && this.options.rearrangeDOM){
      this.moveTab(this.tabs.indexOf(tab), index);
      return this;
    }
    //if the index isn't specified, put the tab at the end
    if (index == null) index = this.tabs.length;
    //if this isn't the first item, and there's a tab
    //already in the interface at the index 1 less than this
    //insert this after that one
    if (index > 0 && this.tabs[index-1] && this.options.rearrangeDOM){
      tab.inject(this.tabs[index-1], 'after');
      section.inject(this.tabs[index-1].retrieve('section'), 'after');
    }
    this.tabs.splice(index, 0, tab);
    clicker = clicker || tab;

    tab.addEvents({
      mouseout: function(){
        tab.removeClass(this.options.mouseoverClass);
      }.bind(this),
      mouseover: function(){
        tab.addClass(this.options.mouseoverClass);
      }.bind(this)
    });

    clicker.addEvent('click', function(e){
      if (this.options.preventDefault) e.preventDefault();
      this.show(index);
    }.bind(this));

    tab.store('tabbered', true);
    tab.store('section', section);
    tab.store('clicker', clicker);
    this.hideSection(index);
    return this;
  },
  removeTab: function(index){
    var now = this.tabs[this.now];
    if (this.now == index){
      if (index > 0) this.show(index - 1);
      else if (index < this.tabs.length) this.show(index + 1);
    }
    this.now = this.tabs.indexOf(now);
    return this;
  },
  moveTab: function(from, to){
    var tab = this.tabs[from];
    var clicker = tab.retrieve('clicker');
    var section = tab.retrieve('section');

    var toTab = this.tabs[to];
    var toClicker = toTab.retrieve('clicker');
    var toSection = toTab.retrieve('section');

    this.tabs.erase(tab).splice(to, 0, tab);

    tab.inject(toTab, 'before');
    clicker.inject(toClicker, 'before');
    section.inject(toSection, 'before');
    return this;
  },
  show: function(i){
    if (this.now == null){
      this.tabs.each(function(tab, idx){
        if (i != idx)
          this.hideSection(idx);
      }, this);
    }
    this.showSection(i).save(i);
    return this;
  },
  save: function(index){
    if (this.options.cookieName)
      Cookie.write(this.options.cookieName, index, {duration:this.options.cookieDays});
    return this;
  },
  recall: function(){
    return (this.options.cookieName) ? Cookie.read(this.options.cookieName) : false;
  },
  hideSection: function(idx){
    var tab = this.tabs[idx];
    if (!tab) return this;
    var sect = tab.retrieve('section');
    if (!sect) return this;
    if (sect.getStyle('display') != 'none'){
      this.lastHeight = sect.getSize().y;
      sect.setStyle('display', 'none');
      if (this.options.selectedClass) tab.removeClass(this.options.selectedClass);
      if (this.options.deselectedClass) tab.addClass(this.options.deselectedClass);
      this.fireEvent('onBackground', [idx, sect, tab]);
    }
    return this;
  },
  showSection: function(idx){
    var tab = this.tabs[idx];
    if (!tab) return this;
    var sect = tab.retrieve('section');
    if (!sect) return this;
    var smoothOk = this.options.smooth && !Browser.ie;
    if (this.now != idx){
      if (!tab.retrieve('tabFx'))
        tab.store('tabFx', new Fx.Morph(sect, this.options.effectOptions));
      var overflow = sect.getStyle('overflow');
      var start = {
        display:'block',
        overflow: 'hidden'
      };
      if (smoothOk) start.opacity = 0;
      var effect = false;
      if (smoothOk){
        effect = {opacity: 1};
      } else if (sect.getStyle('opacity').toInt() < 1){
        sect.setStyle('opacity', 1);
        if (!this.options.smoothSize) this.fireEvent('onActiveAfterFx', [idx, sect, tab]);
      }
      if (this.options.smoothSize){
        var size = sect.getDimensions().height;
        if (this.options.maxSize != null && this.options.maxSize < size){
          size = this.options.maxSize;
        }
        if (!effect) effect = {};
        effect.height = size;
      }
      if (this.now != null) this.hideSection(this.now);
      if (this.options.smoothSize && this.lastHeight) start.height = this.lastHeight;
      sect.setStyles(start);
      var finish = function(){
        this.fireEvent('onActiveAfterFx', [idx, sect, tab]);
        sect.setStyles({
          height: this.options.maxSize == effect.height ? this.options.maxSize : "auto",
          overflow: overflow
        });
        sect.getElements('input, textarea').setStyle('opacity', 1);
      }.bind(this);
      if (effect){
        tab.retrieve('tabFx').start(effect).chain(finish);
      } else {
        finish();
      }
      this.now = idx;
      this.fireEvent('onActive', [idx, sect, tab]);
    }
    if (this.options.selectedClass) tab.addClass(this.options.selectedClass);
    if (this.options.deselectedClass) tab.removeClass(this.options.deselectedClass);
    return this;
  }
});
