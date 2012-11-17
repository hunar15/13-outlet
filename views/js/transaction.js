var editableGrid;
var cashier = 3002;
var itemIdx = 0;
var totalPrice = 0;
window.onload = function() {
	initTable();
	initAddItem();
	initAddTransaction();
	initAddInventory();
}

function initTable(){
	$.getJSON( "/get/transactions", function(data){
		init(data);
		editableGrid.setPageIndex(0);
		editableGrid.filter('');
	});
}

function initAddItem(){

	$('#add-item').click(function(){
		var barcode = $('#inputBarcode').val();
		var quantity = $('#inputQuantity').val();
		if (barcode == '' || quantity == ''){
			$('#prompt-error').show();
			return;
		}
		else
			$('#prompt-error').hide();
		$.ajax({
			url: "/getPrice",
			type: 'POST',
			data: {
					"cashier": cashier,
					"barcode": barcode
			},
			success: function (response) {
				if (response.cashier){
					
					var unitprice = response.price;
					var collectiveprice = parseFloat(unitprice).toFixed(2) * parseInt(quantity);
					totalPrice = totalPrice + collectiveprice;
					$('#total-price').text(totalPrice);
					$('#item-table').append('<tr barcode="'+barcode+'" class="items" id="item-'+itemIdx+'">'+
					'<td>'+response.name+'</td>'+
					'<td>'+quantity+'</td>'+
					'<td>'+unitprice+'</td>'+
					'<td id="collective-'+itemIdx+'">'+collectiveprice+'</td>'+
					'<td><img onclick="removeItem('+itemIdx+')" src="images/delete.png" style="cursor:pointer;" title="Delete item"/></td>');
					$('#new-item-form')[0].reset();
					itemIdx++;
				}
				else
					alert('No such barcode');
			}
		});
	});
	$.getJSON( "/getBarcodes", function(data){
		console.log(data);
		$('#inputBarcode').autocomplete({
			source: data,
			change: function (event, ui) {
				if (!ui.item) {
					 $(this).val('');
				}
			}
		});
	});
}

function removeItem(index){

	var contents = $('td#collective-'+index).text();
	$('#item-'+index).remove();	
	totalPrice = totalPrice - parseFloat(contents).toFixed(2);
	$('#total-price').text(totalPrice);	
}

function initAddTransaction(){
	$('#confirm-checkout').click(function(){
		var itemList = [];
		$('.items').each(function(idx,item){
			var item_obj = new Object();
			item_obj.barcode = $(item).attr('barcode');
			item_obj.quantity = $(item).children()[1].textContent;
			item_obj.price = $(item).children()[2].textContent;
			itemList.push(item_obj);
		});
		$.ajax({
			url: "/add/transaction",
			type: 'POST',
			data: {
				"cashier":cashier,
				"list":itemList
			},
			success: function (response) {
				initTable();
				$('#addNewTransaction').modal('hide');
				itemIdx = 0;
				$('.items').remove();
				totalPrice = 0;
				$('#total-price').text(totalPrice);	
			}
		});

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
	editableGrid.renderGrid("transactioncontent", "testgrid");


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