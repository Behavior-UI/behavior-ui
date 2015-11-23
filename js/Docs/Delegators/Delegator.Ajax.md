Delegator Trigger: ajax
=======================

Loads the response of a link's URL into a specified target.

### Example

	<a href="/get/list/item.php"
		data-trigger="ajax"
		data-ajax-options="
			'action': 'injectBottom',
			'target': '!body ul'
		">Add to bottom of list.</a>
	<ul>
		<li>The response from the link will be injected after this list item.</li>
	</ul>

The above example will load the response from the links HREF (`get/list/item.php`) and load it into the specified target at the bottom.

### Options

* target - (*string*; required) - a selector which will return the DOM element to update. Use selectors provided by [Slick](https://github.com/mootools/slick) to select parents and sibling trees.
* action - (*string*; optional) - the action to take on the target. Any of the options described below.
* method - (*string*; optional) - the HTML verb to use; defaults to `get`.
* filter - (*string*; optional) - a selector to run against the response whose response will be used to update the DOM instead of the full response.
* loadOnce - (*boolean*; optional) - if `true`, the link will only load content into its target once. Subsequent clicks are ignored (a console warning is displayed).
* throttle - (*number*; optional) - delays the ajax request and kills it if a subsequent request is made within this time frame (in ms). Defaults to 0 (i.e. no throttle).
* encode - (*string*; optional) - the selector to find an element to URL encode with the request at the time of invocation. Specify a selector to an input and only that input is sent. Any other DOM element encodes all of its children to send. Allows for the special selector "self" which encodes the element with the trigger on it.
* useSpinner - (*boolean*; optional) - if `true` uses an instance of the MooTools More Spinner class on the target.
* spinnerTarget - (*string*; optionals) - selector to find an alternate target for the spinner than the ajax update target.
* evalScripts - (*boolean*; optional) - if `true` evaluates scrips in the response.
* href - (*string*; optional) - specifies the url to fetch; defaults to the `href` property on the element.
* updateHistory - (*boolean*; optional) - if `true` changes the url of the document upon request success. Uses the api value for `historyURI` if set, otherwise the api value for `href` if it is set, and finally defaults to the `href` property of the element.
* historyURI - (*string*; optional) - if set and the api value for `updateHistory` is `true` this value is used for the new location of the page.
* errorRedirectURL - (*string*; optional) - if set, the whole page will be reloaded to the specified URL if a failure occurs during the AJAX request.

### Actions

* `replace` - replaces the target with the response.
* `update` - empties the target and injects the response into it
* `injectTop` - inserts the response at the top of the target before any of it's other children.
* `injectBottom` - inserts the response at the bottom of the target after any of it's other children.
* `injectBefore` - inserts the response before the target.
* `injectAfter` - inserts the response after the target.
* `ignore` - response is discarded.

### Notes

If you're using [Behavior](http://github.com/anutron/behavior) with Delegator, you should connect the two so that the response can be run through Behavior's filtering mechanisms. See the documentation for Delegator.
