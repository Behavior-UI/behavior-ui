
/*
---

name: Delegator.ResizeImage

description: Delegator for resizing images before they are uploaded

requires:
 - Behavior/Delegator
 - ImageResizer

provides: [Delegator.ResizeImage]

...
*/


/*
  <input data-trigger="resizeImage"
    data-resizeimage-options="
      preferredWidth: 500,
      targetInput: '~input'
    "
  />
  <input type="hidden" name="imgDataUrl"/>
*/

Delegator.register('change', {

  resizeImage: {
    defaults: {
      preferredWidth: 1000,
      targetForm: '!form'
    },

    requireAs: {
      preferredWidth: Number,
      targetInput: String,
      submitOnComplete: Boolean,
      targetForm: String
    },

    handler: function(event, element, api){
      var submitter = function(){
        if (api.getAs(Boolean, 'submitOnComplete')){
          api.getElement('targetForm').fireEvent('submit').submit();
        }
      }

      // create a new instance of our resizer
      new ImageResizer(element, {
        preferredWidth: api.getAs(Number, 'preferredWidth'),
        onComplete: function(dataURL){
          // and set our target input's value
          api.getElement('targetInput').value = dataURL;
          // unset the file input (so the big image isn't submitted)
          element.removeProperty('value');
          submitter();
        },
        onError: function(){
          submitter();
        }
      });
    }
  }
});
