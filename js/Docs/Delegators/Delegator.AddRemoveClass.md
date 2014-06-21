Delegator Triggers: addClass, removeClass, toggleClass
=======================

Provides triggers for adding, removing, and toggling classes on a target element.

Delegator Trigger: toggleClass
------------------------------

Toggles a Class on a specified element.

### Example

	<div class="foo">
		<p>
			<a id="parent" data-trigger="toggleClass" data-toggleclass-options="'target':'!div.foo', 'class':'bar'">Toggle the .bar class on the parent div.</a>
			<a id="self" data-trigger="toggleClass" data-toggleclass-options="'class':'bar'">Toggle the .bar class on this link</a>
		</p>
	</div>

### Options

* target - (*string*; optional) A selector for the element you wish to toggle the class. If not specified will change the class on the element itself.
* targets - (*string*; optional) A selector that returns multiple elements you wish to alter. Ignored if `target` is set.
* class - (*string*; **required**) The class you wish to toggle.

Delegator Trigger: addClass
------------------------------

Adds a Class to a specified element.

### Example

	<div class="foo">
		<p>
			<a id="parent" data-trigger="addClass" data-addclass-options="'target':'!div.foo', 'class':'bar'">Add the .bar class on the parent div.</a>
			<a id="self" data-trigger="addClass" data-addclass-options="'class':'bar'">Add the .bar class on this link</a>
		</p>
	</div>

### Options

* target - (*string*; optional) A selector for the element you to which to add the class. If not specified will change the class on the element itself.
* targets - (*string*; optional) A selector that returns multiple elements you wish to alter. Ignored if `target` is set.
* class - (*string*; **required**) The class you wish to add.

Delegator Trigger: removeClass
------------------------------

Removes a Class from a specified element.

### Example

	<div class="foo bar">
		<p>
			<a id="parent" data-trigger="removeClass" data-removeclass-options="'target':'!div.foo', 'class':'bar'">Remove the .bar class on the parent div.</a>
			<a id="self" class="bar" data-trigger="removeClass" data-removeclass-options="'class':'bar'">Remove the .bar class on this link</a>
		</p>
	</div>

### Options

* target - (*string*; optional) A selector for the element you from which to remove the class. If not specified will change the class on the element itself.
* targets - (*string*; optional) A selector that returns multiple elements you wish to alter. Ignored if `target` is set.
* class - (*string*; **required**) The class you wish to remove.