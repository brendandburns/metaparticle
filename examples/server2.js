var mp = require('../metaparticle');
var os = require('os');

var service = mp.service(
        "my-service",
	mp.shard(3,
	function(data) {
		return JSON.stringify(data).length % 3;
	},
	function(data) {
		return {"network": os.networkInterfaces()};
	},
	function(responses) {
		var merged = [];
		for (var i = 0; i < responses.length; i++) {
			merged.push(responses[i]);
		}
		return merged;
       }));
service.subservices.shard.expose = true;

mp.serve();
