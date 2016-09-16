/*
---
description: Loads Keyboard configuration via DOM instructions.
provides: [Behavior.Keyboard]
requires: [More/Keyboard, Behavior/Delegator, Behavior/Behavior]
script: Behavior.Keyboard.js
name: Behavior.Keyboard
...
*/



/*

Example:

Element with a standard delegator trigger on it:

  <a id="foo" data-trigger="addClass" data-addclass-options="'class':'bar'">Add the .bar class on this link</a>

Another element with keyboard configuration that references it:

  <a data-keyboard-options="
      'keys': {
        'shift+b': {
          'target': '!body #foo',
          'trigger': 'addClass',
          'options': { // options here would override the setting on the specified element;
                       // you don't need to specify them, but it effectively allows you to run
                       // keyboard events without specifying a trigger anywhere else
            'class': 'foo',
            'target': 'self',
            'if': {
              '!body div.bar::hasClass': ['boo']
            }
          }
        }
      }
    "
  >...</a>

Can also reference itself:

<a id="foo" data-trigger="addClass"
            data-addclass-options="'class':'bar'"
            data-keyboard-options="
              'keys': {
                'shift+b': {
                  'trigger': 'addClass'
                }
              }
            "
>Add the .bar class on this link</a>

*/

(function(){

  Behavior.addGlobalFilter('Keyboard', {

    returns: Keyboard,

    defaults: {
      defaultEventType: 'keydown'
    },

    setup: function(el, api){

      var kb = new Keyboard({
        defaultEventType: api.get('defaultEventType'),
        active: true
      });

      var attach = function(container){
        // new dom content, find all the elements with keyboard settings

        findKeyElements(container).each(function(element){
          // get the values for data-keyboard-options / data-keyboard-keys
          // see html example above
          var reader = new BehaviorAPI(element, 'keyboard');
          // iterate over each event entry. An entry looks like:
          // 'shift+b': {
          //   'target': '!body #foo',
          //   'trigger': 'addClass'
          // }
          var hotkeys = reader.getAs(Object, 'keys');
          if (hotkeys) Object.each(hotkeys, function(config, keyCombo){
            addHandler(element, api, config, keyCombo, kb);
          });
          if (element.get('data-keyboard-key')) addHandler(element, api, {}, element.get('data-keyboard-key'), kb);
        });
      };


      api.addEvents({
        ammendDom: attach,
        destroyDom: function(elements){
          // for each element removed
          Array.from(elements).each(function(container){
            // find all elements with keyboard instructions
            findKeyElements(container).each(function(element){
              // get their configuration
              var reader = new BehaviorAPI(element, 'keyboard');
              // iterate over the hotkeys
              var keys = reader.getAs(Object, 'keys');
              if (keys){
                Object.each(keys, function(config, keys){
                  // retrieve their event handler pointer
                  var handler = element.retrieve(keys);
                  // if found (just insulates against the same element getting cleaned twice)
                  // remove it from keyboard
                  if (handler){
                    kb.removeEvent(keys, handler);
                    // remove it from storage
                    element.eliminate(keys);
                  }
                });
              }
            });
          });
        }
      });

      attach(el);

      api.onCleanup(function(){
        kb.deactivate();
      });
      return kb;
    }

  });

  var addHandler = function(element, api, config, keyCombo, keyboardInstance){
    // create a function to handle the keyboard event
    var handler = function(event){
      // if the configuration allows events when inputs have focus
      // OR no inputs have focus...
      if (config.allowInputs ||
          !(
            document.activeElement &&
            ['input', 'select', 'textarea'].contains(document.activeElement.get('tag'))
           )
         ){
        // if only specific inputs are allowed,
        // check if the active element is one of the ones specified
        if (config.activeInputs){
          var activeInputs = Behavior.getTargets(element, config.activeInputs);
          if (activeInputs.contains(document.activeElement)) trigger(event, element, config, api);
        } else {
          // else all inputs are allowed / no input has focus, so call the trigger
          trigger(event, element, config, api);
        }
      }
    };
    // add it to keyboard
    keyboardInstance.addEvent(keyCombo, handler);
    // store it on the element, so we can destroy it later
    element.store(keyCombo, handler);
  };

  var findKeyElements = function(container){
    var kids = container.getElements('[data-keyboard-keys], [data-keyboard-options], [data-keyboard-key]');
    kids.push(container);
    return kids;
  };

  var trigger = function(event, element, config, api){
    var target = Behavior.getTarget(element, config.target ||  'self');
    if (!target) api.fail('could not find keyboard event target for ' + config.target);
    var delegator = api.getDelegator();
    var localAPI;

    event.preventDefault();
    if (config.trigger){
      if (config.options) localAPI = delegator._getAPI(target, { name: config.trigger }).setDefault(config.options);
      delegator.trigger(config.trigger, target, event, true, localAPI);
    } else {
      target.getTriggers().each(function(name){
        delegator.trigger(name, target, event, true);
      });
    }
  };

})();
