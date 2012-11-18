function inventorySync(){
	console.log('opening');
		$.blockUI({ css: {
            border: 'none',
            padding: '15px',
            backgroundColor: '#000',
            '-webkit-border-radius': '10px',
            '-moz-border-radius': '10px',
            opacity: .5,
            color: '#fff'
        } });

        //setTimeout($.unblockUI, 2000);
	$.ajax({
		url: "/sync/inventory",
		type: 'GET',
		success: function (response) {
			$.unblockUI();
			initTable();
			//alert(response.responseText);
		},
		error: function (response) {
			$.unblockUI();
			alert('error..');
		}
	});
}

function requestSync(){
	console.log('shop has closed');
	$.blockUI({ css: {
		border: 'none',
		padding: '15px',
		backgroundColor: '#000',
		'-webkit-border-radius': '10px',
		'-moz-border-radius': '10px',
		opacity: .5,
		color: '#fff'
	} });	
	$.ajax({
		url: "/sync/requests",
		type: 'GET',
		success: function (response) {
			$.unblockUI();
			initTable();
			//alert(response.responseText);
		}
	});
}
function priceSync(){
	console.log('shop has closed');
	$.blockUI({ css: {
		border: 'none',
		padding: '15px',
		backgroundColor: '#000',
		'-webkit-border-radius': '10px',
		'-moz-border-radius': '10px',
		opacity: .5,
		color: '#fff'
	} });	
	$.ajax({
		url: "/recompute/sellingPrice",
		type: 'GET',
		success: function (response) {
			$.unblockUI();
			initTable();
			//alert(response.responseText);
		}
	});
}

function revenueSync(){
	console.log('shop has closed');
	$.blockUI({ css: {
		border: 'none',
		padding: '15px',
		backgroundColor: '#000',
		'-webkit-border-radius': '10px',
		'-moz-border-radius': '10px',
		opacity: .5,
		color: '#fff'
	} });	
	$.ajax({
		url: "/sync/revenue",
		type: 'GET',
		success: function (response) {
			$.unblockUI();
			initTable();
			//alert(response.responseText);
		}
	});
}