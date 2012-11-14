var editableGrid;
window.onload = function() {
	initTable();
}

function initTable(){
	$.getJSON( "get/inventory", function(data){
		init(data);
		editableGrid.setPageIndex(0);
		editableGrid.filter('');
	});
}

function init(data){
	editableGrid = new EditableGrid("DemoGridJSON", {
		enableSort: true, // true is the default, set it to false if you don't want sorting to be enabled
		editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the old-school mode
		editorzoneid: "edition", // will be used only if editmode is set to "fixed"
		pageSize: 10,
		maxBars: 10
	});

	$('#filter').bind('keypress',function(e){
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) {
			editableGrid.filter($('#filter').val());
		}		
	});
	
	editableGrid.load({"metadata": data.metadata,"data": data.data});
	editableGrid.renderGrid("inventorytablecontent", "testgrid");
	
	editableGrid.setCellRenderer("discontinue", new CellRenderer({render: function(cell, value) {
		// this action will remove the row, so first find the ID of the row containing this cell 
		var rowId = editableGrid.getRowId(cell.rowIndex);
		
		cell.innerHTML = "<a onclick=\"if (confirm('Are you sure you want to discontinue this product ? ')) { discontinueProduct("+cell.rowIndex+");} \" style=\"cursor:pointer\">" +
						 "<img src=\"images/delete.png\" border=\"0\" alt=\"delete\" title=\"Delete row\"/></a>";
	}})); 
	

	editableGrid.updatePaginator = function () {
		var paginator = $("#paginator").empty();
		var nbPages = editableGrid.getPageCount();
		console.log(nbPages);
		// get interval
		var interval = editableGrid.getSlidingPageInterval(10);
		if (interval == null) return;

		// get pages in interval (with links except for the current page)
		var pages = editableGrid.getPagesInInterval(interval, function(pageIndex, isCurrent) {
			if (isCurrent) return "" + (pageIndex + 1);
			return $("<a>").css("cursor", "pointer")
				.html(pageIndex + 1)
				.click(function(event) {
					console.log(parseInt($(this).html()) - 1);
					//editableGrid.setPageIndex(parseInt($(editableGrid).html()) - 1); 
				});
		});

		// "first" link
		var link = $("<a>").html("<img src='images/gofirst.png'/>&nbsp;");
		if (!editableGrid.canGoBack())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else 
			link.css("cursor", "pointer").click(function(event) {
				editableGrid.firstPage(); 
				//updatePaginator();
				});
		console.log(link);
		paginator.append(link);

		// "prev" link
		link = $("<a>").html("<img src='images/prev.png'/>&nbsp;");
		if (!editableGrid.canGoBack())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else
			link.css("cursor", "pointer").click(function(event) { 
				editableGrid.prevPage(); 
				//updatePaginator()
			});
		console.log(link);
		paginator.append(link);
		
		// pages
		for (p = 0; p < pages.length; p++) paginator.append(pages[p]).append(" | ");

		// "next" link
		link = $("<a>").html("<img src='images/next.png'/>&nbsp;");
		if (!editableGrid.canGoForward())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else
			link.css("cursor", "pointer").click(function(event) {
				editableGrid.nextPage(); 
				//updatePaginator();
				});
		console.log(link);
		paginator.append(link);

		// "last" link
		link = $("<a>").html("<img src='images/golast.png'/>&nbsp;");
		if (!editableGrid.canGoForward())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else
			link.css("cursor", "pointer").click(function(event) { 
				editableGrid.lastPage(); 
				//updatePaginator();
			});
		console.log(link);
		paginator.append(link);

	};

	editableGrid.tableRendered = function() { this.updatePaginator(); };
}

function discontinueProduct(rowIndex) {
	var barcode = editableGrid.getRowValues(rowIndex).barcode;
	var outlet_id = editableGrid.getRowValues(rowIndex).outlet_id;
	console.log(barcode);
	console.log(outlet_id);
	$.ajax({
		url: "/delete/inventory",
		type: 'POST',
		data: {
				"product_barcode": barcode,
				"outlet_id": outlet_id
		},
		success: function (response) {
			
			console.log('successfully deleted'+ barcode);
			console.log(response);
			editableGrid.remove(rowIndex);	
		}
	});
}