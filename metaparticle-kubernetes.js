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
            recursiveFn([], services, runKubernetesServiceReplicationController);
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

        var makeReplicationController = function(service, shard) {
	    var port = 3000;
            var rc = {
                "kind": "ReplicationController",
                "apiVersion": "v1",
                "metadata": {
                    "name": service.name + "." + shard,
                    "namespace": "default",
                    "labels": {
                        "shard": "" + shard,
                        "service": service.name
                    }
                },
                "spec": {
                    "replicas": 1,
                    "selector": {
                        "shard": "" + shard,
                        "service": service.name
                    },
                    "template": {
                        "metadata": {
                            "labels": {
                                "shard": "" + shard,
                                "service": service.name
                            }
                        },
                        "spec": {
                            "containers": [{
                                'name': service.name,
                                'image': '10.0.0.1:5000/brendanburns/metaparticle',
                                'command': ['node', path.basename(process.argv[1]), 'serve', '' + port],
                                'ports': [{
                                    'containerPort': port
                                }]
                            }],
                            "restartPolicy": "Always",
                            "dnsPolicy": "ClusterFirst",
                        }
                    }
                },
            }
            return rc;
        };

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

        var makeService = function(name, labels) {
            var service = {
                'kind': 'Service',
                'apiVersion': 'v1',
                'metadata': {
                    'name': name
                },
                'spec': {
                    'selector': labels,
                    'ports': [{
                        'protocol': 'TCP',
                        'port': 3000,
                        'targetPort': 2999
                    }]
                }
            }

            return service;
        }

        var runKubernetesServiceDeployment = function(service) {
            runKubernetesCommand('kubectl create -f -', makeDeployment(service));
            runKubernetesCommand('kubectl create -f -', makeService(service.name, {
                'app': service.name
            }));
        };

        var runKubernetesServiceReplicationController = function(service) {
            for (var i = 0; i < service.replicas; i++) {
                labels = {
                    'service': service.name,
                    'shard': '' + i
                }
                runKubernetesCommand('kubectl create -f -', makeReplicationController(service, i));
                runKubernetesCommand('kubectl create -f -', makeService(getHostname(service.name, i), labels));
            }
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
            recursiveFn([], services, deleteKubernetesServiceReplicationController);
        }

        var deleteKubernetesServiceDeployment = function(service) {
            runKubernetesCommand('kubectl delete -f -', makeDeployment(service));
            runKubernetesCommand('kubectl delete -f -', makeService(service.name, {
                'app': service.name
            }));
        };

        var deleteKubernetesServiceReplicationController = function(service) {
            for (var i = 0; i < service.replicas; i++) {
                runKubernetesCommand('kubectl delete -f -', makeReplicationController(service, i));
                runKubernetesCommand('kubectl delete -f -', makeService(getHostname(service.name, i), {}));
                }
            };

            /**
             * Get the hostname of a shard in a particular service.
             * Called at runtime.
             * @param {string} serviceName The name of the service to get the hostname for.
             * @param {number} shard The integer number of the shard
             */
            module.exports.getHostname = function(serviceName, shard) {
                return servinceName + '-' + shard;
            };
        }());
