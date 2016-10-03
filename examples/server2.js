var mp = require('../metaparticle');
var os = require('os');

var service = mp.service(
        "my-service",
	mp.scatter(3, function(data) {
		return {"network": os.networkInterfaces()};
	},
	function(responses) {
		var merged = [];
		for (var i = 0; i < responses.length; i++) {
			merged.push(responses[i]);
		}
		return merged;
       }));
service.subservices.gather.expose = true;

mp.serve();
