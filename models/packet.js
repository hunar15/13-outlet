var request = require('request');
var config = require('../config/config');

var async = require('async');
var connection = config.connection;
var hq_host = config.hq_host,
	outletid = config.outletid;



exports.push = function (args, prime_callback) {
	// body...
	/*
	{
		query : '',
		length : '',
		url : '',
		data : '',
	}

	*/
	var query = args.query,
		length = args.length,
		url = args.url,
		data = args.data;
		//packetQuery = args.packetQuery;


	connection.query(query, function (err,rows,fields) {
		// body...
		if(!err) {
			var size = rows.length,
				segments = Math.ceil(size/length),
				post_options = {
					url : hq_host+url,
					json : true,
					body : {}
				},
				tmp = [],
				i=0;
			console.log('Number of segments : '+ segments);
			async.forEachSeries(rows, function (item,callback) {
				// body...
				i++;
				if((i%length)===0 || i==length) {
					post_options.body.data = data;
					post_options.body.list = tmp;
					tmp = [];
					request.post(post_options, function (error,response,body) {
						// body...
						if(!error) {
							if(body.STATUS === 'SUCCESS') {
								callback(null);
							}
							else
								callback(true);
						}
					});
				} else {
					tmp.push(rows[i-1]);
					callback(null);
				}
			}, function(err){
					// if any of the saves produced an error, err would equal that error
					if(err)
						prime_callback(err,null);
					else
						prime_callback(null,true);
			});

		} else {
			console.log("Error in length_query : " + err);
			callback(true,null);
		}
	});

};

exports.pull = function  (args, prime_callback) {
	// body...
	/*
	{
		probeUrl : '',
		dataUrl : '',
		length : '',
		data : '',
	}
	*/
	var probeUrl = args.probeUrl,
		length = args.length,
		url = args.dataUrl,
		data = args.data,
		packetQuery = args.packetQuery;

	var post_options = {
		url : hq_host+probeUrl,
		json : true,
		body : data
	};

	request.post(post_options,function (error,response,body) {
		// body...
		if(!error) {
			if(body.STATUS === 'SUCCESS') {
				var size = body.size,
					segments = Math.ceil(size/length),
					i=0,
					counter,
					tmp=[],
					list=[];

				for(counter =0; counter < segments; counter++) {
					tmp.push(0);
				}

				async.forEachSeries(tmp, function (item,callback) {
					// body...
					post_options.body ={};
					post_options.body.index = i;
					post_options.body.length = length;
					post_options.body.data = data;
					post_options.url = hq_host+url;

					request.post(post_options, function (error2,response2,body2) {
						// body...
						if(!error2) {
							if(body2.STATUS === 'SUCCESS') {
								i++;
								console.log('Segment ' + i + ' Received');
								/*for(var j in body2.list) {
									console.log("Number " +(i-1)*length +j+ ' : '+list[(i-1)*length + j]);
									list.push(body2.list[j]);
								}
								callback(null);*/
								packetQuery(body2.list,callback);
							} else {
								callback(true);
							}
						}
					});
				}, function(err){
					// if any of the saves produced an error, err would equal that error
					if(!err) {
						//prime_callback(null,list);
						prime_callback(null,true);
					} else
						prime_callback(err,null);
				});
			}
		} else {
			prime_callback(error,true);
		}
	});
};