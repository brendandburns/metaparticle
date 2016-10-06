var mp = require('../metaparticle');
var os = require('os');

var numShards = 3;

// A sharded service that shards based on user-id length
var service = mp.service(
	"sharded-service",
	// Defines the sharded service
	mp.shard(
		numShards,
		function shardingFunction(data) {
			try {
				return data.user.length % numShards;
			} catch (ex) {
				return 0;
			}
		},
		function serviceFunction(data) {
			return {
				"request": data,
				"server": os.hostname()
			};
		}));

service.subservices.shard.expose = true;

mp.serve();
