Behavior Filter: Behavior.OverText
===================================

Creates an instance of [Fx.Accorion][] for an element using the `Accordion` data filter.

### Example

	<div data-behavior="Accordion" data-accordion-options="
	    'headers':'.header' //the default
	    'sections':'.section' //the default
	    'display': 1,
	    'initialDisplayFx': false
	">
	  <div class="header">Toggle 1</div>
	  <div class="section">This area is controlled by Toggle 1.</div>
	  <div class="header">Toggle 2</div>
	  <div class="section">This area is controlled by Toggle 2.</div>
	  <div class="header">Toggle 3</div>
	  <div class="section">This area is controlled by Toggle 3.</div>
	</div>;

### Options

* elements - (*string*; defaults to `.header`) The selector to run against the element to find all the clickable headers.
* sections - (*string*; defaults to `.section`) The selector to run against the element to find all the clickable sections.
* display - (*number*; defaults to `0`) The index of the element to show at start (with a transition). To force all elements to be closed by default, pass in -1.
* show  - (*number*) The index of the element to be shown initially.
* trigger - (*string*; defaults to 'click') The event that triggers a change in element display.
* orientation - (*string*; defaults to `vertical`) Either `vertical` or `horizontal` - determines whether or not the accordion transitions height or width. Horizontal accordions require CSS mastery to pull off, so be wary.
* opacity - (*boolean*; defaults to `true`) If set to `true`, an opacity transition effect will take place when switching between displayed elements.
* height      - (*boolean*: defaults to true) If set to true, a height transition effect will take place when switching between displayed elements.
* width       - (*boolean*: defaults to false) If set to true, it will add a width transition to the accordion when switching between displayed elements. Warning: CSS mastery is required to make this work!
* fixedHeight - (*number*) If set, displayed elements will have a fixed height equal to the specified value.
* fixedWidth - (*number*) If set, displayed elements will have a fixed width equal to the specified value.
* alwaysHide - (*boolean*; defaults to `false`) If set to `true`, it will be possible to close all displayable elements. Otherwise, one will remain open at all time.
* initialDisplayFx - (*boolean*; defaults to `true`) If set to `false`, the initial item displayed will not display with an effect but will just be shown immediately.
* resetHeight - (*boolean*; defaults to `true`) If set to `false`, the height of an opened accordion section will be set to an absolute pixel size.

[Fx.Accordion]: http://mootools.net/docs/more/Fx/Fx.Accordion