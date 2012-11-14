var editableGrid;
var global;
window.onload = function() {
	initTable();
	initSetReceived();
}

function initTable(){
	$.getJSON( "get/request/all", function(data){
		init(data);
		editableGrid.setPageIndex(0);
		editableGrid.filter('');
	});
}

function initSetReceived(){
	$('#confirm-checked-product').click(function(){
		var batch_received=[];
		$('.received-check').each(function(k,v){
			if ($(v).attr('checked')=='checked')
				batch_received.push($(v).attr('id').substring(6));
		});

		var outlet_id = $('#outlet-id').text();
		var date = $('#restock-date').text();
		
		if (batch_received.length == 0)
			$('#restockDetails').modal('hide');
			
		$.each(batch_received, function(k,v){
			
			$.ajax({
				url: "/setAsReceived",
				type: 'POST',
				data: {
					"outlet_id": outlet_id,
					"date": date,
					"barcode": v
				},
				success: function (response) {
					if (k==(batch_received.length - 1)){
						initTable();
						$('#restockDetails').modal('hide');
					}
				}
			});
		});

		
	});	
}

function init(data){
	editableGrid = new EditableGrid("DemoGridJSON", {
		enableSort: false, // true is the default, set it to false if you don't want sorting to be enabled
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
	editableGrid.renderGrid("restocktablecontent", "testgrid");
	
	editableGrid.setCellRenderer("approve", new CellRenderer({render: function(cell, value) {
		// this action will remove the row, so first find the ID of the row containing this cell 
		var rowId = editableGrid.getRowId(cell.rowIndex);
		//##########
		//insert if condition here to check if batch has already been approved
		//##########
		var status = editableGrid.getRowValues(rowId).status;
		if (status == "FORWARDED")
			cell.innerHTML = "<img src=\"images/approved.png\" border=\"0\" title=\"Forwarded to supplier\"/></a>";
		else if (status == "DISPATCHED")
			cell.innerHTML = "<img src=\"images/dispatched.png\" border=\"0\" title=\"Forwarded to supplier\"/></a>";
		else
			cell.innerHTML = "<a onclick=\"if (confirm('Are you sure you want to approve this batch ? ')) { approveBatch("+cell.rowIndex+");} \" style=\"cursor:pointer\">" +
						 "<img src=\"images/approve.png\" border=\"0\" title=\"Approve row\"/></a>";
	}})); 
	
	editableGrid.setCellRenderer("details", new CellRenderer({render: function(cell, value) {
		var rowId = editableGrid.getRowId(cell.rowIndex);

		var status = editableGrid.getRowValues(rowId).status;
		
		cell.innerHTML = "<a href=\"#restockDetails\" data-toggle=\"modal\" onclick=\"generateDetails("+cell.rowIndex+"); \" style=\"cursor:pointer\">" +
						 "<img src=\"images/view.png\" border=\"0\" alt=\"delete\" title=\"View details\"/></a>";
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
		paginator.append(link);

	};

	editableGrid.tableRendered = function() { this.updatePaginator(); };
}

function initDetail(data){
	detailedEditableGrid = new EditableGrid("RequestDetail", {
		enableSort: true, // true is the default, set it to false if you don't want sorting to be enabled
		editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the old-school mode
		editorzoneid: "edition", // will be used only if editmode is set to "fixed"
		pageSize: 10,
		maxBars: 10
	});

	$('#detailfilter').bind('keypress',function(e){
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) {
			detailedEditableGrid.filter($('#filter').val());
		}		
	});
	
	detailedEditableGrid.load({"metadata": data.metadata,"data": data.data});
	detailedEditableGrid.renderGrid("restockdetailstablecontent", "detailgrid");
	
	detailedEditableGrid.setCellRenderer("received", new CellRenderer({render: function(cell, value) {
		// this action will remove the row, so first find the ID of the row containing this cell 
		var rowId = detailedEditableGrid.getRowId(cell.rowIndex);
		if (value==0)
			cell.innerHTML = "<input class='received-check' id='check-"+rowId+"' type='checkbox'/>";
		else
			cell.innerHTML = "<input type='checkbox' checked='true' disabled='true'/>";
	}})); 
	
	detailedEditableGrid.updatePaginator = function () {
		var paginator = $("#paginator").empty();
		var nbPages = detailedEditableGrid.getPageCount();
		console.log(nbPages);

		// get interval
		var interval = detailedEditableGrid.getSlidingPageInterval(10);
		if (interval == null) return;

		// get pages in interval (with links except for the current page)
		var pages = detailedEditableGrid.getPagesInInterval(interval, function(pageIndex, isCurrent) {
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
		if (!detailedEditableGrid.canGoBack())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else 
			link.css("cursor", "pointer").click(function(event) {
				detailedEditableGrid.firstPage(); 
				//updatePaginator();
				});
		paginator.append(link);

		// "prev" link
		link = $("<a>").html("<img src='images/prev.png'/>&nbsp;");
		if (!detailedEditableGrid.canGoBack())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else
			link.css("cursor", "pointer").click(function(event) { 
				detailedEditableGrid.prevPage(); 
				//updatePaginator()
			});
		paginator.append(link);
		
		// pages
		for (p = 0; p < pages.length; p++) paginator.append(pages[p]).append(" | ");

		// "next" link
		link = $("<a>").html("<img src='images/next.png'/>&nbsp;");
		if (!detailedEditableGrid.canGoForward())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else
			link.css("cursor", "pointer").click(function(event) {
				detailedEditableGrid.nextPage(); 
				//updatePaginator();
				});
		paginator.append(link);

		// "last" link
		link = $("<a>").html("<img src='images/golast.png'/>&nbsp;");
		if (!detailedEditableGrid.canGoForward())
			link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
		else
			link.css("cursor", "pointer").click(function(event) { 
				detailedEditableGrid.lastPage(); 
				//updatePaginator();
			});
		paginator.append(link);

	};

	detailedEditableGrid.tableRendered = function() { this.updatePaginator(); };
}


function approveBatch(rowIndex) {
	var outlet_id = editableGrid.getRowValues(rowIndex).outlet_id;
	var date = editableGrid.getRowValues(rowIndex).date;
	$.ajax({
		url: "/request/approve",
		type: 'POST',
		data: {
			"outlet_id": outlet_id,
			"date": date
		},
		success: function (response) {
			initTable();
		}
	});
}

function generateDetails(rowIndex) {
	var outlet_id = editableGrid.getRowValues(rowIndex).outlet_id;
	var outlet_name = editableGrid.getRowValues(rowIndex).s_name;
	var date = editableGrid.getRowValues(rowIndex).date;
	var status = editableGrid.getRowValues(rowIndex).status;
	if (status != "FORWARDED" && status != "DISPATCHED")
		$('#confirm-checked-product').attr("disabled",true);
	else
		$('#confirm-checked-product').attr("disabled",false);
		
	console.log(outlet_id);
	console.log(date);
	$.ajax({
		url: "/get/requestDetails", //change this
		type: 'POST',
		data: {
			"outlet_id": outlet_id,
			"date": date
		},
		success: function (response) {
			initDetail(response);
			detailedEditableGrid.setPageIndex(0);
			detailedEditableGrid.filter('');
			$('#outlet-id').text(outlet_id);
			$('#outlet-name').text(outlet_name);
			$('#restock-date').text(date);
			$('#restockDetails').modal('show');
		}
	});	
}