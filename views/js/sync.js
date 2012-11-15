function openingSync(){
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
		url: "/syncAtStart",
		type: 'GET',
		success: function (response) {
			$.unblockUI();
			alert(response.responseText);
		},
		error: function (response) {
			$.unblockUI();
			alert('error..');
		}
	});
}

function closingSync(){
	console.log('shop has closed');
	$.ajax({
		url: "/syncAtEnd",
		type: 'GET',
		success: function (response) {
			alert(response.responseText);
		}
	});
}