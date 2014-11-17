/*
---
description: Prompts the user to confirm a link click.
provides: [Delegator.Confirm]
requires: [Behavior/Delegator, Bootstrap.Popup, More/Elements.from]
name: Delegator.Confirm

...
*/
(function(){

  Delegator.register('click', {
    confirm: {
      defaults: {
        authInput: '#auth_form_id input[name=authenticity_token]',
        caption: 'Confirm'
      },
      handler: function(event, link, api){
        event.preventDefault();
        var doubleCheck = function(){
          return !api.get('doubleCheck') ||
                  confirm("No, SERIOUSLY. Do you like, double-dog, totally, for sure you want to do this?");
        };
        var onConfirm = function(e){
          if (!doubleCheck()){
            e.preventDefault()
            return;
          }
          // allow delete
          if (link.get('data-method')){
            e.preventDefault();
            // delete operations have to be sent as a POST w/ a hidden _method value
            var form = new Element('form',{
              method: 'POST',
              action: link.get('href'),
              styles: {
                display: 'none'
              }
            }).adopt(new Element('input',{
              type: 'hidden',
              name: '_method',
              value: link.get('data-method').toUpperCase()
            })).inject(link, 'after');
            var auth = $$(api.get('authInput'))[0];
            if (auth) auth.clone().inject(form);
            form.fireEvent('submit').submit();
          }

        };
        var onCancel = function(){};

        var isButton = link.get('type') == 'input' || link.get('type') == 'button' || link.get('type') == 'submit' || link.get('tag', 'button');
        if (api.get('form') || isButton){ // selector to find a form element relative to the clicked element: e.g. !form
          var form = link.getElement(api.get('form'));
          if (isButton && !form) form = link.getParent('form');
          if (!form && api.get('form')) api.fail('Could not find form (' + api.get('form') + ') relative to confirm element');
          if (form){
            if (form.retrieve('validator') && !form.retrieve('validator').validate()) return;
            var btnInfo = new Element(
              'input',
              {
                'type': 'hidden',
                'name': link.get('name'),
                'value': link.get('value') || 0
              }
            );
            btnInfo.inject(form);

            onConfirm = function(){
              if (!doubleCheck()) return;
              // allow delete
              if (link.get('data-method')) form.set('method', link.get('data-method'));
              form.fireEvent('submit').submit();
              btnInfo.destroy();
            };
            onCancel = function(){
              btnInfo.destroy();
            };
          }
        }

        var prompt = make_prompt({
          caption: api.get('caption'),
          content: api.get('content'),
          body: api.get('body'),
          url: link.get('href'),
          onConfirm: onConfirm,
          onCancel: onCancel,
          deleting: (link.get('data-method')||"").toLowerCase() == 'delete'
        }).addClass('hide');
        prompt.inject(document.body);
        var popup = new Bootstrap.Popup(prompt, {persist: false});
        popup.show();
        link.store('Bootstrap.Popup', popup);
        return popup;
      }
    }
  });

  var make_prompt = function(options){
    content = options.body ? Elements.from(options.body) : options.content ? new Element('p').set('html', options.content) : '';
    buttons = options.buttons || [{
      'class': 'btn',
      'html': 'Cancel',
      'events': {
        'click': options.onCancel || function(){}
      }
    }, {
      'class': 'btn btn-ok ' + (options.deleting ? 'btn-danger' : 'btn-primary'),
      'html': options.deleting ? 'DELETE' : 'Ok',
      'href': options.url,
      'events': {
        'click': options.onConfirm || function(){}
      }
    }];
    if (Bootstrap.version == 2){
      return new Element('div.modal.confirm').adopt(
        new Element('div.modal-header').adopt(
          new Element('a.close').set('html', 'x'),
          new Element('h3').set('html', options.caption)
        ),
        new Element('div.modal-body').adopt(content),
        new Element('div.modal-footer').adopt(
          buttons.map(function(button){
            return new Element('a', button).addClass('dismiss');
          })
        )
      );
    } else {
      return new Element('div.modal.confirm').adopt(
        new Element('div.modal-dialog').adopt(
          new Element('div.modal-content').adopt(
            new Element('div.modal-header').adopt(
              new Element('a.close.fui-cross'),
              new Element('h6').set('html', options.caption)
            ),
            new Element('div.modal-body').adopt(content),
            new Element('div.modal-footer').adopt(
              buttons.map(function(button){
                return new Element('a', button).addClass('dismiss');
              })
            )
          )
        )
      );
    }
  };

})();
