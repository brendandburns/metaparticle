(function() {
    var docker = require('dockerode');
    var client = new docker({socketPath: '/var/run/docker.sock'});

    module.exports.run = function() {
    	client.run('brendandburns/metaparticle', ['node', '/server.js', 'serve', '3000'], process.stdout, 
	{
		'ExposedPorts': {
    			'3000/tcp': {}
  		}
  	},
	{
		"PortBindings": { "3000/tcp": [{ "HostPort": "3000" }] }
	},
        function (err, data, container) {
  		console.log(data);
                console.log(err);
	});	
    };
}());

