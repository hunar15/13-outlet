var editableGrid;
var cashier = 3002;
var itemIdx = 0;
var totalPrice = 0;
var global;
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
		if (barcode == '' || quantity == '') return;
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
					console.log('no such barcode');
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

function initAddInventory(){
	$('#confirm-inventory-product').click(function(){
		var barcode = $('#product-barcode').text();
		var outlet_ids = $('#outlet-selector').val();
		var selling_price = $('#inputSellingPrice').val();
		var min_stock = $('#inputMinStock').val();
		
		console.log(barcode);
		console.log(outlet_ids);
		console.log(selling_price);
		console.log(min_stock);
		if (validInventoryDetails(selling_price,min_stock))
			$.ajax({
				url: "/add/inventory",
				type: 'POST',
				data: {
						"product_barcode":barcode,
						"outlet_ids": outlet_ids,
						"selling_price": selling_price,
						"min_stock": min_stock
				},
				success: function (response) {
					$('#addNewInventory').modal('hide');
					document.getElementById("new-inventory-form").reset();
				}
			});
	});
}
function validProductDetails(name, category, manufacturer, cost_price){
	var valid = true;
		
	if (name.length == 0 || name.length > 150){ //more than 8 digits
		$('label[for=inputName]').addClass('invalid');
		valid = false;
	}
	else
		$('label[for=inputName]').removeClass('invalid');
		
	if (category.length == 0 || category.length > 100){
		$('label[for=inputCategory]').addClass('invalid');
		valid = false;
	}
	else
		$('label[for=inputCategory]').removeClass('invalid');
		
	if (parseInt(manufacturer) > 9999 || manufacturer.length == 0 || !parseInt(manufacturer)){
		$('label[for=inputManufacturer]').addClass('invalid');
		valid = false;
	}
	else
		$('label[for=inputManufacturer]').removeClass('invalid');
	
	if (!parseFloat(cost_price)){
		$('label[for=inputPrice]').addClass('invalid');
		valid = false;
	}
	else
		$('label[for=inputPrice]').removeClass('invalid');

	return valid;
}

function validInventoryDetails(selling_price,min_stock){
	var valid = true;
	var alertmsg = '';
	if (!parseFloat(selling_price)){
		$('label[for=inputSellingPrice]').addClass('invalid');
		valid = false;
		alertmsg = alertmsg + 'Selling price must be a float! ';
	}
	else
		$('label[for=inputSellingPrice]').removeClass('invalid');
		
	if (!parseInt(min_stock)){
		$('label[for=inputMinStock]').addClass('invalid');
		valid = false;
		alertmsg = alertmsg + 'Minimum stock must be an integer!';
	}
	else
		$('label[for=inputMinStock]').removeClass('invalid');
	
	if (valid)
		return true;
	else
	{
		alert(alertmsg);
		return false;
	}
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

function addInventory(rowIndex) {
	var barcode = editableGrid.getRowValues(rowIndex).barcode;
	var product_name = editableGrid.getRowValues(rowIndex).name;
	$('#product-name').text(product_name);
	$('#product-barcode').text(barcode);
	initOutlet(barcode);
}

function initOutlet(barcode){
	var product = new Object();
	product.barcode = barcode;
	$.ajax({
		url: "/get/inventory/notSelling",
		type: 'POST',
		data: product,
		success: function (response) {
			$('#outlet-selector').empty();
			$.each(response, function(k,v){
				$('#outlet-selector').append('<option id="outlet-choice-'+v.id+'" value="'+v.id+'">'+v.s_name+'</option>');	
			});
		}
	});
}

function submitInventory(){
	$.ajax({
		url: "/delete/product",
		type: 'POST',
		data: {
				"barcode": barcode
		},
		success: function (response) {
			
			console.log('successfully deleted'+ barcode);
			console.log(response);
			editableGrid.remove(rowIndex);	
		}
	});
}