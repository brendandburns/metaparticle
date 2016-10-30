var mp = require('metaparticle');
var os = require('os');

var numReplicas = 3;

var service = mp.service(
	"replicated-storage-service",
	// A service that is spread amongst 3 replicas
	mp.spread(
		numReplicas,
		function serviceFunction(data) {
			if (!mp.scope.global.requests) {
				mp.scope.global.requests = 0;
			}
			mp.scope.global.requests++;
			return {
				"requests": mp.scope.global.requests,
				"server": os.hostname()
			};
		}
	)
);

service.subservices.shard.expose = true;

mp.serve();
