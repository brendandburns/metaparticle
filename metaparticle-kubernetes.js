// The interface for a metaparticle implementation.
// Not expected to be used, just for documentation
(function() {
    var path = require('path');
    var q = require('q');
    var exec = require('child_process');

    var util = require('./metaparticle-util');

    /**
     * Build all images described in this application
     * @returns A promise (using 'q') that is completed when the build is done.
     */
    module.exports.build = function() {
        return q.fcall(function() {});
    };

    /**
     * Run the described application
     */
    module.exports.run = function(services) {
        recursiveRun([], services);
    };

    var recursiveRun = function(prefix, services) {
        if (!services) {
            return;
        }
        for (var key in services) {
            var service = services[key];
            if (!service.subservices) {
                runKubernetesService(service);
            } else {
                prefix.push(service.name);
                recursiveRun(prefix, service.subservices);
                prefix.pop();
            }
        }
    }

    var makeDeployment = function(service) {
        var deployment = {
            'apiVersion': 'extensions/v1beta1',
            'kind': 'Deployment',
            'metadata': {
                'name': service.name
            },
            'spec': {
                'replicas': service.replicas,
                'template': {
                    'metadata': {
                        'app': service.name
                    },
                    'spec': {
                        'containers': [{
                            'name': service.name,
                            'image': 'brendandburns/metaparticle',
                            'cmd': ['node', path.basename(process.argv[1]), 'serve'],
                            'ports': [{
                                'containerPort': 3000
                            }]
                        }]
                    }
                }
            }
        };

	return deployment;
    }

    var makeService = function(service) {
        var service = {
            'kind': 'Service',
            'apiVersion': 'v1',
            'metadata': {
                'name': service.name
            },
            'spec': {
                'selector': {
                    'app': service.name
                },
                'ports': [{
                    'protocol': 'TCP',
                    'port': 3000,
                    'targetPort': 2999
                }]
            }
        }

	return service;
    }

    var runKubernetesService = function(service) {
        runKubernetesCommand('kubectl create -f', makeDeployment(service));
	runKubernetesCommand('kubectl create -f', makeService(service));
    };

    var runKubernetesCommand = function(cmd, obj) {
	// TODO: use real command here
        var child = exec.exec('cat', {}, function(err, stdout, stderr) {
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            if (err !== null) {
                console.log(`exec error: ${err}`);
            }
        });

        child.stdin.write(JSON.stringify(obj));
        child.stdin.end();
    };

    /**
     * Delete the described application
     */
    module.exports.delete = function(services) {
	runKubernetesCommand('kubectl delete -f', makeDeployment(service));
	runKubernetesCommand('kubectl delete -f', makeService(service));
    };

    /**
     * Get the hostname of a shard in a particular service.
     * Called at runtime.
     * @param {string} serviceName The name of the service to get the hostname for.
     * @param {number} shard The integer number of the shard
     */
    module.exports.getHostname = function(serviceName, shard) {
        return 'implement me!';
    };
}());
