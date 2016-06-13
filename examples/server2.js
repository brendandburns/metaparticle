var mp = require('./metaparticle');
var os = require('os');

mp.service(
        "my-service",
	mp.scatter(3, function(data) {
		return {"A": os.networkInterfaces()};
	},
	function(responses) {
		var merged = [];
		for (var i = 0; i < responses.length; i++) {
			merged.push(responses[i]);
		}
		return merged;
       }));

mp.serve();
