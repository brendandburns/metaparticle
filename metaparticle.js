(function() {
    var jayson = require('jayson');
    var q = require('q');

    // implementation
    var handlers = [];
    var server;
    var runEnvironment;

    // Canonical list of defined services 
    var services = {};

    var makeName = function(service) {
	return service.join(".");
    };

    var makeGUID = function() {
	return Math.floor(Math.random() * 100000).toString(16);
    };

    var findServiceName = function(guid) {
        for (var key in services) {
		var name = recursiveFindServiceName(services[key], [], guid);
		if (name && name.length > 0) {
			return name;
		}
	}
	return null;
    };

    var recursiveFindServiceName = function(service, prefix, guid) {
	if (!service) {
		return null;
	}
	if (service.guid == guid) {
		prefix.push(service.name) 
		return makeName(prefix);
	}
	if (service.subservices) {
		prefix.push(service.name) 
		for (var key in service.subservices) {
			var name = recursiveFindServiceName(service.subservices[key], prefix, guid);
			if (name && name.length > 0) {
				return name;
			}
		}
		prefix.pop();
	}
	return null;
    };

    module.exports.service = function(name, fn) {
       var service = {
          'name': name,
          'subservices': fn.services,
          'replicas': 1,
          'guid': makeGUID(),
          'fn': function(args, callback) {
              if (!fn.async) {
                   callback(null, fn.apply(null, args));
              } else {
		   var params = [callback];
		   for (var i = 0; i < args.length; i++) {
			params.push(args[i]);
		   }
                   fn.fn.apply(null, params);
              }
          }
       }
       services[name] = service;
       handlers[name] = service.fn;
    };

    var requestPromise = function(serviceName, shard, data) {
	var host = runEnvironment.getHostname(serviceName, shard);
	console.log("connecting to: " + host)
    	var client = jayson.client.http("http://" + host + ":3000");
    	var defer = q.defer();
        client.request('scatter', [data], function(err, response) {
              if (err) {
		console.log("Error contacting " + host + ": " + err);
		defer.reject(err);
	      } else {
		defer.resolve(response.result);
              }
        });
	return defer.promise;
    };

    module.exports.spread = function(replicas, computeFn) {
	return module.exports.shard(replicas, function(data) { return Math.floor(Math.random() * replicas); }, computeFn);
    }

    module.exports.shard = function(shards, shardingFn, computeFn) {
	handlers['compute'] = function(args, callback) {
		callback(null, computeFn.apply(null, args));
	}
	var computeGUID = makeGUID();
	return {
	    services: {
		'compute': {
			'name': 'compute',
			'guid': computeGUID,
			'fn': computeFn,
			'replicas': shards
		},
		'shard': {
			'name': 'shard',
			'fn': function(data) { return data; },
			'guid': makeGUID(),
			'depends': [ 'compute' ],
			'replicas': 1
		}
	    },
	    async: true,
	    fn: function(callback, data) {
		var shard = shardingFn(data) % shards;
		var serviceName = findServiceName(computeGUID);
		var promise = requestPromise(serviceName, shard, data);
		promise.then(function(data) {
			callback(null, data);
		}, function(err) {
			callback(err, null);
		});
	    }
	};
   };	

    module.exports.scatter = function(shards, scatterFn, gatherFn) {
        handlers['scatter'] = function(args, callback) {
		callback(null, scatterFn.apply(null, args));
        }
	var scatterGUID = makeGUID();
	return {
            services: {
                'scatter': {
                    'name': 'scatter',
                    'guid': scatterGUID,
                    'fn': scatterFn,
                    'replicas': shards
                },
                'gather': {
                    'name': 'gather',
                    'fn': gatherFn,
                    'guid': makeGUID(),
                    'depends': [ 'scatter' ],
                    'replicas': 1,
                }
            },
            async: true,
            fn: function(callback, data) {
		var promises = [];
		for (var i = 0; i < shards; i++) {
		        var serviceName = findServiceName(scatterGUID);
			promises.push(requestPromise(serviceName, i, data));
                }
                q.all(promises).then(
		function(data) {
			callback(null, gatherFn(data));
		},
		function(err) {
			callback(err, null)
		});
           }
	};
    };

    module.exports.serve = function(runner) {
	runEnvironment = runner;
	if (process.argv[2] == 'serve') {
		console.log(handlers);
          	var server = jayson.server(handlers);
		server.http().listen(parseInt(process.argv[3]));
        } else {
		runner.run(services);
	}
    };

    module.exports.print = function() {
        console.log(JSON.stringify(services, null, 4));
    }
}());

