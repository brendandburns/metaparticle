// The interface for a metaparticle implementation.
// Not expected to be used, just for documentation
(function() {
    var path = require('path');
    var q = require('q');
    var exec = require('child_process');

    var util = require('./metaparticle-util');
    var docker = require('./metaparticle-docker');

    /**
     * Build all images described in this application
     * @returns A promise (using 'q') that is completed when the build is done.
     */
    module.exports.build = function() {
        var name = 'brendanburns/metaparticle'
        var host = '192.168.0.150';

        var defer = q.defer();
        docker.buildImage(host + ":5000/" + name, process.cwd()).then(function() {
            docker.pushImage(name, host + ":5000").then(function(data) {
                defer.resolve(data);
            }, function(err) {
                defer.reject(err);
            })
        }).done();

	return defer.promise;
    };

    /**
     * Run the described application
     */
    module.exports.run = function(services) {
        recursiveFn([], services, runKubernetesService);
    };

    var recursiveFn = function(prefix, services, fn) {
        if (!services) {
            return;
        }
        for (var key in services) {
            var service = services[key];
            if (!service.subservices) {
                // TODO: this should really generate the full name
                fn(service);
            } else {
                prefix.push(service.name);
                recursiveFn(prefix, service.subservices, fn);
                prefix.pop();
            }
        }
    }

    var makeDeployment = function(service) {
	var port = 3000;
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
                        'labels': {
                            'app': service.name
                        }
                    },
                    'spec': {
                        'containers': [{
                            'name': service.name,
                            'image': '10.0.0.1:5000/brendanburns/metaparticle',
                            'command': ['node', path.basename(process.argv[1]), 'serve', '' + port],
                            'ports': [{
                                'containerPort': port 
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
        runKubernetesCommand('kubectl create -f -', makeDeployment(service));
        runKubernetesCommand('kubectl create -f -', makeService(service));
    };

    var runKubernetesCommand = function(cmd, obj) {
        var child = exec.exec(cmd, {}, function(err, stdout, stderr) {
            console.log(`${stdout}`);
            if (err !== null) {
                console.log(`stderr: ${stderr}`);
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
        recursiveFn([], services, deleteKubernetesService);
    }

    var deleteKubernetesService = function(service) {
        runKubernetesCommand('kubectl delete -f -', makeDeployment(service));
        runKubernetesCommand('kubectl delete -f -', makeService(service));
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
