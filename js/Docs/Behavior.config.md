/*
---

name: Behavior.config

description: Generic config file for pages that use behavior and delegator for their js invocation

requires:
 - Core/Request.HTML
 - More/Form.Request

provides: [Behavior.config]

...
*/


Request.HTML.implement({
  options: {
    evalScripts: false
  }
});

Form.Request.implement({
  options: {
    requestOptions: {
      evalScripts: false
    }
  }
});