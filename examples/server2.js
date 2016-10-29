var mp = require('metaparticle');
var os = require('os');

var numReplicas = 3;

// Create a randomly distributed service
var service = mp.service(
	"replicated-service",
	// A service that is spread amongst 3 replicas
	mp.spread(
		numReplicas,
		function serviceFunction(data) {
			return {
				"request": data,
				"server": os.hostname()
			};
		}));

service.subservices.shard.expose = true;

mp.serve();
