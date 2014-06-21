/*
---
name: Behavior.HtmlTable Tests
description: n/a
requires: [More-Behaviors/Behavior.HtmlTable, Behavior-Tests/Behavior.SpecsHelpers]
provides: [Behavior.HtmlTable.Tests]
...
*/

(function(){

	var data = [
		{"id":56,"timezone":"Europe/Amsterdam","name":"Amsterdam","geolat":52.3789,"geolong":4.90067},
		{"id":46,"timezone":"America/New_York","name":"Atlanta","geolat":33.7525,"geolong":-84.3888},
		{"id":42,"timezone":"America/Chicago","name":"Austin","geolat":30.2669,"geolong":-97.7428},
		{"id":63,"timezone":"America/New_York","name":"Baltimore","geolat":39.294255,"geolong":-76.614275},
		{"id":24,"timezone":"America/New_York","name":"Boston","geolat":42.3583,"geolong":-71.0603},
		{"id":32,"timezone":"America/Chicago","name":"Chicago","geolat":41.8858,"geolong":-87.6181},
		{"id":64,"timezone":"America/New_York","name":"Cleveland","geolat":41.499819,"geolong":-81.693716},
		{"id":43,"timezone":"America/Chicago","name":"Dallas / Fort Worth","geolat":32.7887,"geolong":-96.7676},
		{"id":25,"timezone":"America/Denver","name":"Denver","geolat":39.734,"geolong":-105.026},
		{"id":47,"timezone":"America/New_York","name":"Detroit","geolat":42.3333,"geolong":-83.0484},
		{"id":48,"timezone":"America/Chicago","name":"Houston","geolat":29.7594,"geolong":-95.3594},
		{"id":66,"timezone":"America/New_York","name":"Indianapolis","geolat":39.767016,"geolong":-86.156255},
		{"id":65,"timezone":"America/Chicago","name":"Kansas City","geolat":39.090431,"geolong":-94.583644},
		{"id":49,"timezone":"America/Los_Angeles","name":"Las Vegas","geolat":36.1721,"geolong":-115.122},
		{"id":61,"timezone":"Europe/London","name":"London","geolat":51.50714,"geolong":-0.126171},
		{"id":34,"timezone":"America/Los_Angeles","name":"Los Angeles","geolat":34.0443,"geolong":-118.251},
		{"id":39,"timezone":"America/New_York","name":"Miami","geolat":25.7323,"geolong":-80.2436},
		{"id":67,"timezone":"America/Chicago","name":"Milwaukee","geolat":43.038902,"geolong":-87.906474},
		{"id":51,"timezone":"America/Chicago","name":"Minneapolis / St. Paul","geolat":44.9609,"geolong":-93.2642},
		{"id":70,"timezone":"America/New_York","name":"Montreal","geolat":45.545447,"geolong":-73.639076},
		{"id":52,"timezone":"America/Chicago","name":"New Orleans","geolat":29.9544,"geolong":-90.075},
		{"id":22,"timezone":"America/New_York","name":"New York City","geolat":40.7255,"geolong":-73.9983},
		{"id":72,"timezone":"America/Chicago","name":"Omaha","geolat":41.254006,"geolong":-95.999258},
		{"id":33,"timezone":"America/New_York","name":"Philadelphia","geolat":39.8694,"geolong":-75.2731},
		{"id":53,"timezone":"America/Phoenix","name":"Phoenix","geolat":33.4483,"geolong":-112.073},
		{"id":60,"timezone":"America/New_York","name":"Pittsburgh","geolat":40.4405,"geolong":-79.9961},
		{"id":37,"timezone":"America/Los_Angeles","name":"Portland","geolat":45.527,"geolong":-122.685},
		{"id":57,"timezone":"America/New_York","name":"Raleigh / Durham","geolat":35.7797,"geolong":-78.6434},
		{"id":73,"timezone":"America/New_York","name":"Richmond","geolat":37.542979,"geolong":-77.469092},
		{"id":71,"timezone":"America/Denver","name":"Salt Lake City","geolat":40.760779,"geolong":-111.891047},
		{"id":68,"timezone":"America/Chicago","name":"San Antonio","geolat":29.424122,"geolong":-98.493628},
		{"id":38,"timezone":"America/Los_Angeles","name":"San Diego","geolat":32.7153,"geolong":-117.156},
		{"id":23,"timezone":"America/Los_Angeles","name":"San Francisco","geolat":37.7587,"geolong":-122.433},
		{"id":41,"timezone":"America/Los_Angeles","name":"Seattle","geolat":47.6036,"geolong":-122.326},
		{"id":62,"timezone":"America/Chicago","name":"St. Louis","geolat":38.627491,"geolong":-90.198417},
		{"id":69,"timezone":"America/New_York","name":"Toronto","geolat":43.670233,"geolong":-79.386755},
		{"id":59,"timezone":"America/Vancouver","name":"Vancouver","geolat":49.259515,"geolong":-123.103867},
		{"id":31,"timezone":"America/New_York","name":"Washington, DC","geolat":38.8964,"geolong":-77.0447}
	];

	var header = function(cls, dataProps){
		var str = '<table data-behavior="HtmlTable" ';

		for (prop in dataProps){
			str += prop + '="'  + dataProps[prop] + '"';
		}

		str +=     ' class="' + cls + '" data-table-resize="table" cellpadding="0" cellspacing="0">\
							<thead>\
								<tr>\
									<th>ID</th>\
									<th>TimeZone</th>\
									<th>Name</th>\
									<th>GEO Latitude</th>\
									<th>GEO Longitude</th>\
								</tr>\
							</thead>\
						<tbody>';
		return str;
	};
	var str = function(i){
		var val = data[i%data.length];
		return '<tr>\
							<td>' + val.id + '</td>\
							<td>' + val.timezone + '</td>\
							<td>' + val.name + '</td>\
							<td>' + val.geolat + '</td>\
							<td>' + val.geolong + '</td>\
						</tr>';
	};
	var footer = '</tbody></table>';
	var build = function(str, times) {
		var result = '';
		times.times(function(i){
			result += str(i);
		});
		return result;
	};

	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable (400 rows / 5 col); resizable',
	// 	content: header('', {'data-htmltable-options': "'resizable': true"}) + build(str, 400) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		expect(table._resizeEnabled).toBe(true);
	// 	}
	// });

	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable (1000 rows / 5 col); resizable',
	// 	content: header('', {'data-htmltable-options': "'resizable': true"}) + build(str, 1000) + footer,
	// 	returns: HtmlTable,
	// 	specs: false
	// });

	Behavior.addFilterTest({
		filterName: 'HtmlTable',
		desc: 'HtmlTable (400 rows / 5 col); sortable',
		content: header('', {'data-htmltable-options': "'sortable': true"}) + build(str, 400) + footer,
		returns: HtmlTable,
		expect: function(element, table){
			expect(table.sortEnabled).toBe(true);
		}
	});

	Behavior.addFilterTest({
		filterName: 'HtmlTable',
		desc: 'HtmlTable (1000 rows / 5 col); sortable',
		content: header('', {'data-htmltable-options': "'sortable': true"}) + build(str, 1000) + footer,
		returns: HtmlTable,
		specs: false
	});

	Behavior.addFilterTest({
		filterName: 'HtmlTable',
		desc: 'HtmlTable (400 rows / 5 col); multiselect',
		content: header('', {'data-htmltable-options': "'selectable': true, 'allowMultiSelect': true"}) + build(str, 400) + footer,
		returns: HtmlTable,
		expect: function(element, table){
			table.selectAll();
			expect(table.getSelected().length).toBe(400);
		}
	});

	Behavior.addFilterTest({
		filterName: 'HtmlTable',
		desc: 'HtmlTable (1000 rows / 5 col); multiselect',
		content: header('', {'data-htmltable-options': "'selectable': true, 'allowMultiSelect': true"}) + build(str, 1000) + footer,
		returns: HtmlTable,
		specs: false
	});

	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable (400 rows / 5 col); multiselect sortable resizable',
	// 	content: header('', {'data-htmltable-options': "'selectable': true, 'allowMultiSelect': true, 'sortable': true, 'resizable': true"}) + build(str, 400) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		table.selectAll();
	// 		expect(table.getSelected().length).toBe(400);
	// 		expect(table.sortEnabled).toBe(true);
	// 		expect(table._resizeEnabled).toBe(true);
	// 	}
	// });

	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable (1000 rows / 5 col); multiselect sortable resizable',
	// 	content: header('', {'data-htmltable-options': "'selectable': true, 'allowMultiSelect': true, 'sortable': true, 'resizable': true"}) + build(str, 1000) + footer,
	// 	returns: HtmlTable,
	// 	specs: false
	// });

	// var treeTable = '<table id="tree2" data-behavior="HtmlTable" data-htmltable-options="\'selectable\':true, \'enableTree\': true, \'multiselect\': true">';
	// var treeHead = '<thead><th>Name</th><th>Date Modified</th><th>Size</th></thead><tbody>';
	// var treeRows = function(){ return '<tr class="table-folder table-depth-0" id="docs2"><td><a class="expand"></a>Documents</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-1"><td>Resume.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-1"><td>notes.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-folder table-depth-1"><td><a class="expand"></a>Receipts</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>starbucks.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>safeway.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>movies.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-folder table-depth-2"><td><a class="expand"></a>Taxes</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>2008 Taxes.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>2009 Taxes.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>2010 Taxes.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-folder table-depth-2"><td><a class="expand"></a>Pictures</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>Baby.jpg</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>Bar.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="table-depth-0"><td>Foo.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr>'; };
	//
	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable: Treeview (300 rows / 3 col); tree selectable NO BUILD',
	// 	content: treeTable + treeHead + build(treeRows, 20) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		expect(table._treeBuilt).toBe(undefined);
	// 		var first = element.getElement('tbody tr');
	// 		table.closeSection(first);
	// 		expect(table.isExpanded(first)).toBe(false);
	// 		table.expandSection(first);
	// 		expect(table.isExpanded(first)).toBe(true);
	// 		expect(table._treeBuilt).toBe(true);
	// 	}
	// });
	//
	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable: Treeview (600 rows / 3 col); tree selectable NO BUILD',
	// 	content: treeTable + treeHead + build(treeRows, 20) + footer,
	// 	returns: HtmlTable,
	// 	specs: false
	// });
	//
	// var treeTableBuild = '<table id="tree2" data-behavior="HtmlTable" data-htmltable-options="\'selectable\':true, \'enableTree\': true, \'multiselect\': true, \'build\': true">';
	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable: Treeview (300 rows / 3 col); tree selectable BUILD',
	// 	content: treeTableBuild + treeHead + build(treeRows, 20) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		var first = element.getElement('tbody tr');
	// 		table.closeSection(first);
	// 		expect(table.isExpanded(first)).toBe(false);
	// 		table.expandSection(first);
	// 		expect(table.isExpanded(first)).toBe(true);
	// 		expect(table._treeBuilt).toBe(true);
	// 	}
	// });
	//
	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable: Treeview (600 rows / 3 col); tree selectable BUILD',
	// 	content: treeTableBuild + treeHead + build(treeRows, 20) + footer,
	// 	returns: HtmlTable,
	// 	specs: false
	// });


	//deprecated html tests

	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable (400 rows / 5 col); resizable (deprecated)',
	// 	content: header('resizable') + build(str, 400) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		expect(table._resizeEnabled).toBe(true);
	// 	}
	// });

	Behavior.addFilterTest({
		filterName: 'HtmlTable',
		desc: 'HtmlTable (400 rows / 5 col); sortable (deprecated)',
		content: header('sortable') + build(str, 400) + footer,
		returns: HtmlTable,
		expect: function(element, table){
			expect(table.sortEnabled).toBe(true);
		}
	});

	Behavior.addFilterTest({
		filterName: 'HtmlTable',
		desc: 'HtmlTable (400 rows / 5 col); multiselect (deprecated)',
		content: header('multiselect') + build(str, 400) + footer,
		returns: HtmlTable,
		expect: function(element, table){
			table.selectAll();
			expect(table.getSelected().length).toBe(400);
		}
	});

	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable (400 rows / 5 col); multiselect sortable resizable (deprecated)',
	// 	content: header('multiselect sortable resizable') + build(str, 400) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		table.selectAll();
	// 		expect(table.getSelected().length).toBe(400);
	// 		expect(table.sortEnabled).toBe(true);
	// 		expect(table._resizeEnabled).toBe(true);
	// 	}
	// });

	// var deprecatedTreeTable = '<table id="tree2" data-behavior="HtmlTable" class="selectable treeView multiselect">';
	// var deprecatedTreeHead = '<thead><th>Name</th><th>Date Modified</th><th>Size</th></thead><tbody>';
	// var deprecatedTreeRows = function(){ return '<tr class="table-folder table-depth-0" id="docs2"><td><a class="expand"></a>Documents</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-1"><td>Resume.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-1"><td>notes.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-folder table-depth-1"><td><a class="expand"></a>Receipts</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>starbucks.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>safeway.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>movies.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-folder table-depth-2"><td><a class="expand"></a>Taxes</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>2008 Taxes.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>2009 Taxes.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>2010 Taxes.pdf</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-folder table-depth-2"><td><a class="expand"></a>Pictures</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-3"><td>Baby.jpg</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="hidden table-depth-2"><td>Bar.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr><tr class="table-depth-0"><td>Foo.txt</td><td>Jul 10, 2010 1:39pm</td><td>--</td></tr>'; };
	//
	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable: Treeview (300 rows / 3 col); tree selectable NO BUILD (deprecated)',
	// 	content: deprecatedTreeTable + deprecatedTreeHead + build(deprecatedTreeRows, 20) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		expect(table._treeBuilt).toBe(undefined);
	// 		var first = element.getElement('tbody tr');
	// 		table.closeSection(first);
	// 		expect(table.isExpanded(first)).toBe(false);
	// 		table.expandSection(first);
	// 		expect(table.isExpanded(first)).toBe(true);
	// 		expect(table._treeBuilt).toBe(true);
	// 	}
	// });
	//
	// var deprecatedTreeTableBuild = '<table id="tree2" data-behavior="HtmlTable" class="selectable treeView multiselect buildTree">';
	// Behavior.addFilterTest({
	// 	filterName: 'HtmlTable',
	// 	desc: 'HtmlTable: Treeview (300 rows / 3 col); tree selectable BUILD (deprecated)',
	// 	content: deprecatedTreeTableBuild + deprecatedTreeHead + build(deprecatedTreeRows, 20) + footer,
	// 	returns: HtmlTable,
	// 	expect: function(element, table){
	// 		var first = element.getElement('tbody tr');
	// 		table.closeSection(first);
	// 		expect(table.isExpanded(first)).toBe(false);
	// 		table.expandSection(first);
	// 		expect(table.isExpanded(first)).toBe(true);
	// 		expect(table._treeBuilt).toBe(true);
	// 	}
	// });

})();