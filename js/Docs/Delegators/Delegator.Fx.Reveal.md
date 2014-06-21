Delegator Triggers: Reveal, Dissolve, Nix, ToggleReveal
=======================

Provides delegated links to use [Fx.Reveal](http://mootools.net/docs/more/Fx/Fx.Reveal) on a given target.

### Examples

	<div>
		<p>
			<a style="display: block" id="toggleParent" data-trigger="toggleReveal" data-togglereveal-options="'target':'!div', 'fxOptions':{'duration': 0}">Toggle parent</a>
			<a style="display: block" id="toggleSelf" data-trigger="toggleReveal" data-togglereveal-options="'fxOptions':{'duration': 0}">Toggle self</a>
			<a style="display: block" id="revealParent" data-trigger="reveal" data-reveal-options="'target':'!div', 'fxOptions':{'duration': 0}">Reveal Parent</a>
			<a style="display: block" id="revealSelf" data-trigger="reveal" data-reveal-options="'fxOptions':{'duration': 0}">Reveal Self</a>
			<a style="display: block" id="dissolveParent" data-trigger="dissolve" data-dissolve-options="'target':'!div', 'fxOptions':{'duration': 0}">Dissolve parent</a>
			<a style="display: block" id="dissolveSelf" data-trigger="dissolve" data-dissolve-options="'fxOptions':{'duration': 0}">Dissolve self</a>
			<a style="display: block" id="nixParent" data-trigger="nix" data-nix-options="'target':'!div', 'fxOptions':{'duration': 0}">nix parent</a>
			<a style="display: block" id="nixSelf" data-trigger="nix" data-nix-options="'fxOptions':{'duration': 0}">Nix self</a>
			<a style="display: block" id="nixAll" data-trigger="nix" data-nix-options="'targets':'!div a">Nix all the links</a>
		</p>
	</div>

The above examples use `Fx.Reveal` to show, hide, and destroy their respective targets.

### Options

* target - (*string*) - a selector which will return the DOM element to show/hide. Use selectors provided by [Slick](https://github.com/mootools/slick) to select parents and sibling trees.
* targets - (*string*) - same as `target` except this will apply the effect to multiple targets (all the ones that match the selector).
* fxOptions - (*object*; optional) - a set of options to be passed to `Fx.Reveal`.
* allowEvent - (*boolean*) if `true` the trigger does not call `event.preventDefault()` - defaults to `false`.