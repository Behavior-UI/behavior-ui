Delegator Triggers: checkAll, checkNone, checkToggleAll
=======================

Provides click event delegators for selecting or deselecting a group of checkboxes.

### checkAll, checkNone

#### Example

	<div class="chex">
		<a data-trigger="checkAll" data-checkall-options ="'targets': '!div.chex input'">checkAll</a>
		<a data-trigger="checkNone" data-checknone-options="'targets': '!div.chex input'">checkNone</a></p>
		<hr/>
		<input type="checkbox"/>
		<input type="checkbox"/>
		<input type="checkbox"/>
		<input type="checkbox"/>
		<input type="checkbox"/>
	</div>

#### Options

* targets - (*string*; **required**) a selector that will return the inputs to check/uncheck.

### checkToggle

#### Example
	<div class="chex">
		<label>
			<input type="checkbox" data-trigger="checkToggleAll" data-checktoggleall-options= "
				'targets': '!div.chex input',
				'classTarget': '!label',
				'class': 'red'
			" />
			Here's a label
		</label>
		<label>
			<input type="checkbox"/>
			Here's a label
		</label>
		<label>
			<input type="checkbox"/>
			Here's a label
		</label>
		<label>
			<input type="checkbox"/>
			Here's a label
		</label>
		<label>
			<input type="checkbox"/>
			Here's a label
		</label>
		<label>
			<input type="checkbox"/>
			Here's a label
		</label>
	</div>

#### Options

* targets - (*string*; **required**) a selector that will return the inputs to check/uncheck.
* class - (*string*; **optional**) a class to apply to the targets' classTarget.
* classTarget - (*string*; **optional**) a selector relative to the targets to apply *class* to.

### See Also

MooTools' selector engine (Slick) supports [reversed combinators](https://github.com/mootools/slick/wiki/reversed-combinators).