function openingSync(){
	console.log('shop has opened');
	$.ajax({
		url: "/syncAtStart",
		type: 'GET',
		success: function (response) {
			alert(response.responseText);
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