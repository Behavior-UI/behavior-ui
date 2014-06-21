Behavior Filter: Behavior.HtmlTable
===================================

Creates an instance of [HtmlTable][] for an element using the `HtmlTable` data filter.

See also:

* [HtmlTable][]
* [HtmlTable.Sort][]
* [HtmlTable.Select][]

### Example

	<table data-behavior="HtmlTable" data-htmltable-options="
		'sortable':true, 'selectable':true,
		'parsers':['number', 'string']
	">
		<thead>
			<tr>
				<td>column 1</td> <td>column 2</td>
			</tr>
		<thead>
		<tbody>
			<tr>
				<td>1</td> <td>a</td>
				<td>2</td> <td>b</td>
				<td>3</td> <td>4</td>
		</tbody>
	</table>

### Options

* sortOnStartup - (*boolean*; defaults to `false`) If `true` the table is sorted on startup. This is expensive; use sparingly.
* sortIndex - (*number*) This is the initial column to sort (if `sortOnStartup` is `true`). The first `th` that does not have the `noSort` class is used unless a `th` is found with the class `defaultSort`. If `sortOnStartup` is false, this is still used to add the classnames and styling to the column as if it were sorted.
* sortReverse - (*boolean*) if `true`, sorts the column reverse on startup (if `sortOnStartup` is `true`).
* parsers - (*array*) A mapping of parsers for each column of data. See the parsers defined in [HtmlTable.Sort][].
* sortable - (*booelan*; defaults to `false`) You can also give the table the css class `sortable` to set this flag to `true`.
* classNoSort - (*string*; defaults to `noSort`) The string given to column headers that are not sortable.
* selectable - (*boolean*; defaults to `false`) You can also give the table the css class `selectable` or `multiselect` to set this flag to `true`.
* allowMultiSelect - (*boolean*; defaults to `false`) You can also give the table the css class `multiselect` to set this flag to `true`.
* useKeyboard - (*boolean*; defaults to `true`) Enables keyboard controls (up/down). You can also give the table the css class `noKeyboard` to disable this flag.

[HtmlTable]: http://mootools.net/docs/more/Interface/HtmlTable
[HtmlTable.Sort]: http://mootools.net/docs/more/Interface/HtmlTable.Sort
[HtmlTable.Select]: http://mootools.net/docs/more/Interface/HtmlTable.Select