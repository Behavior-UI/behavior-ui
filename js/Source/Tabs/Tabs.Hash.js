/*
---

name: Tabs.Hash

description: Stores tab selection in the window.hash

license: MIT-Style License

requires:
 - More/String.QueryString
 - More/Object.Extras
 - Tabs
 - Element.Events.hashchange

provides: Tabs.Hash

...
*/

var getHash = function(){
  return window.location.hash.substring(1, window.location.hash.length).parseQueryString();
};

Tabs.Hash = new Class({
  Extends: Tabs,
  options: {
    hash: null // the hash value to store the state in
  },
  initialize: function(options){
    this.setOptions(options);
    // delete the hash option on startup so that the call to show(0) doesn't change the location hash
    hash = this.options.hash;
    if (hash){
      delete options.hash;
      delete this.options.hash;
      options.preventDefault = true;
    }
    this.parent(options);
    if (hash){
      // put the hash back
      this.options.hash = hash;
      this.bound = {
        showByHash: this.showByHash.bind(this)
      };
      // watch hashchange for changes
      window.addEvent('hashchange', this.bound.showByHash);
      this.showByHash();
    }
  },
  // shows a section based on the window location hash value
  showByHash: function(){
    var i = this.getIndexByHash();
    if (i || i===0) this.show(i);
    return this;
  },
  // gets the index to show based on an elementID
  // returns NULL if nothing is found
  getIndexById: function(id){
    var target = document.id(id);
    if (target && this.tabs.contains(target)) return this.tabs.indexOf(target);
    else if (target && this.sections.contains(target)) return this.sections.indexOf(target);
    return null;
  },
  // gets the hash value and returns the index to be shown
  // returns UNDEFINED if there was no hash value
  // returns NULL if no element was found and the value wasn't an int already
  // NOTE: hash value may be an int or a string; int if the tab/section had no id
  getIndexByHash: function(){
    var hash = getHash();
    if (!hash) return this;
    var value = hash[this.options.hash];
    if (value && isNaN(value.toInt())){
      var i = this.getIndexById(value);
      if (i !== null) value = i;
      else return null;
    }
    return value;
  },
  // for optimization purposes, we store the sections, the base class doesn't do this
  addTab: function(tab, section, clicker, index){
    this.parent.apply(this, arguments);
    this.sections[this.tabs.indexOf(tab)] = section;
  },
  // on show, update the hash
  show: function(i){
    this.parent.apply(this, arguments);
    if (this.options.hash){
      var hash = getHash() || {};
      hash[this.options.hash] = this.tabs[i].get('id') || this.sections[i].get('id') || i;
      window.location.hash = Object.cleanValues(Object.toQueryString(hash));
    }
  },
  destroy: function(){
    if (this.bound) window.removeEvent('hashchange', this.bound.showByHash);
    this.tabs.each(function(el){
      el.removeEvents();
    });
    this.tabs = null;
    this.sections = null;
  }
});