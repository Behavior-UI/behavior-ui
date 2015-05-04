/*
---

name: Behavior.MobileMenu

description: Behavior for adding a mobile menu

requires:
 - Behavior/Behavior
 - More/Object.Extras
 - MobileMenu

provides: [Behavior.MobileMenu]

...
*/

Behavior.addGlobalFilter('MobileMenu', {

  defaults: {
    target: '.mobile-nav'
  },

  returns: MobileMenu,

  setup: function(element, api){
    var navbar = $$(api.get('navbar'))[0];
    var navbarClass = api.get('navbarClass');
    var target = $$(api.get('target'))[0];
    if (!element) api.fail('Could not find the button for MobileMenu');
    if (!target) api.fail('Could not find the target (the menu itself) for MobileMenu');

    var mm = new MobileMenu(element, target,
      Object.merge(
        {
          onHide: function(){
            if (navbar && navbarClass) navbar.removeClass(navbarClass);
          },
          onReveal: function(){
            if (navbar && navbarClass) navbar.addClass(navbarClass);
          }
        },
        Object.cleanValues(
          api.getAs({
            zIndex: Number,
            revealClass: String
          })
        )
      )
    );
    api.onCleanup(mm.detach.bind(mm));
    return mm;
  }
});
