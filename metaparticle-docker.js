(function() {
    var docker = require('dockerode');
    var client = new docker({socketPath: '/var/run/docker.sock'});

    module.exports.run = function(services) {
        recursiveRun([], services);
    }

    var recursiveRun = function(prefix, services) {
        for (var key in services) {
		var service = services[key];
	        prefix.push(service.name);
        	if (service.subservices) {
			recursiveRun(prefix, service.subservices);
		} else {
			runDocker(service, prefix.join("."));
		}
	        prefix.pop();
	}
    }

    var runDocker = function(service, name) {
	var replicas = service.replicas;
	if (!replicas) {
		replicas = 1;
	}
    	for (var i = 0; i < replicas; i++) {
		runReplica(service, name + "." + i);
	}
    };

    var runReplica = function(service, name) {
	client.createContainer(
	{
		Image: 'brendandburns/metaparticle',
		Cmd: ['node', '/server.js', 'serve', '3000'],
		name: name,
	        ExposedPorts: {
                        '3000/tcp': {}
                }	
	},
	function (err, container) {
		container.start( 
		{
			//"PortBindings": { "3000/tcp": [{ "HostPort": "3000" }] }
		},
        	function (err, data) {
  			if (data) {
				console.log(data);
			}
                	if (err) {
				console.log(err);
			}
		});
	});	
    };
}());

