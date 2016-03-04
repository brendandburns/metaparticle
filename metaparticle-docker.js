(function() {
    var q = require('q');
    var docker = require('dockerode');
    var client = new docker({socketPath: '/var/run/docker.sock'});

    module.exports.run = function(services) {
        var promise = createNetwork('network');
	promise.then(function(network) {
        	recursiveRun([], services, network);
	});
    }

    var createNetwork = function(name) {
        var deferred = q.defer();
        client.createNetwork({
                "Name":name,
                "Driver":"bridge",
                "IPAM":{
                        "Config":[{
                                "Subnet":"172.20.0.0/16",
                                "IPRange":"172.20.10.0/24",
                                "Gateway":"172.20.10.11"
                        }]
                },
                "Internal":true
        }, function(err, data) {
                if (err) {
                        console.log("Error creating network: " + err);
			deferred.reject(err);
                } else {
			deferred.resolve(data);
		}
        });
	return deferred.promise;
    };

    var recursiveRun = function(prefix, services, network) {
        for (var key in services) {
		var service = services[key];
	        prefix.push(service.name);
        	if (service.subservices) {
			recursiveRun(prefix, service.subservices, network);
		} else {
			runDocker(service, prefix.join("."), network);
		}
	        prefix.pop();
	}
    }

    var runDocker = function(service, name, network) {
	var replicas = service.replicas;
	if (!replicas) {
		replicas = 1;
	}
    	for (var i = 0; i < replicas; i++) {
		runReplica(service, name + "." + i, network);
	}
    };

    var runReplica = function(service, name, network) {
	var deferred = q.defer();
	client.createContainer(
	{
		Image: 'brendandburns/metaparticle',
		Cmd: ['node', '/server2.js', 'serve', '3000'],
		name: name,
	        ExposedPorts: {
                        '3000/tcp': {}
                }	
	},
	function (err, container) {
		if (err) {
			console.log('error creating: ' + err);
			deferred.reject(err);
		} else {
			deferred.resolve(container);
		}
	});
	
	var deferred2 = q.defer();
	deferred.promise.then(
	function(container) {
		container.start( 
		{
			//"PortBindings": { "3000/tcp": [{ "HostPort": "3000" }] }
		},
        	function (err, data) {
                	if (err) {
				console.log(err);
				deferred2.reject(err);
			} else {
				deferred2.resolve(container);
			}
		});
	}).done();
	deferred2.promise.then(
	function(data) {
		network.connect({
			"Container": data.id
		}, function(err, data) {
			if (err) {
				console.log(err);
			}
		});
	}).done();
    };

}());

