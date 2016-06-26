// The interface for a metaparticle implementation.
// Not expected to be used, just for documentation
(function() {
    // builtins
    var path = require('path');
    var exec = require('child_process');

    // installed
    var q = require('q');
    var log = require('loglevel');

    // local
    var util = require('./metaparticle-util');
    var docker = require('./metaparticle-docker');

    // Dependency injection
    var execFn = exec.exec;
    module.exports.injectExecForTesting = function(fn) {
        execFn = fn;
    };
    var buildImageFn = docker.buildImage;
    var pushImageFn = docker.pushImage;
    module.exports.injectDockerImageForTesting = function(buildFn, pushFn) {
	buildImageFn = buildFn;
	pushImageFn = pushFn;
    };
    
    // Config
    // Docker registry to push to
    var host = process.env['DOCKER_REGISTRY'] 
    // Docker registry to pull from
    var serverHost = process.env['DOCKER_IMAGE_REGISTRY'];
    if (!serverHost) {
        serverHost = host;
    }
    var registryPort = 5000;
    
    // Load the name prefix or bail
    var namePrefix = process.env['DOCKER_IMAGE_PREFIX'];
    if (!namePrefix) {
        namePrefix = 'metaparticle'
    }

    /**
     * Build all images described in this application
     * @returns A promise (using 'q') that is completed when the build is done.
     */
    module.exports.build = function(services) {
        var promises = [];      
        recursiveFn([], services, function(name) {
            promises.push(buildImage(name));
        });
        return q.all(promises);
    };

    var buildImage = function(name) {
        var img = host + ":" + registryPort + "/" + namePrefix + "/" + name;
        var defer = q.defer();
        buildImageFn(img, process.cwd()).then(function() {
            log.debug('starting push');
            pushImageFn(img, host + ":" + registryPort).then(function(data) {
                log.debug('push successful');
                defer.resolve(data);
            }, function(err) {
                log.error('Error pushing: ' + err);
                defer.reject(err);
            })
        }, function(err) {
            log.error('Error building: ' + err);
            defer.reject(err);
        }).done();

        return defer.promise;
    };

    /**
     * Run the described application
     */
    module.exports.run = function(services, args, env) {
        recursiveFn([],
                    services,
                    runKubernetesServiceReplicationController,
                    {
                        'args': args,
                        'env': env
                    });
    };

    var recursiveFn = function(prefix, services, fn, opts) {
        if (!services) {
            return;
        }
        for (var key in services) {
            var service = services[key];
            if (!service.subservices) {
                var prefixStr = ''
                if (prefix.length > 0) {
                    prefixStr = prefix.join('-') + '-';
                }
                fn(prefixStr + service.name, service, opts);
            } else {
                prefix.push(service.name);
                recursiveFn(prefix, service.subservices, fn, opts);
                prefix.pop();
            }
        }
    }

    // exported for testing
    module.exports.recursiveFnForTesting = recursiveFn;

    var makeReplicationController = function(name, service, shard, opts) {
        var port = 3000;
        var envArr = [];
        if (!opts) {
            opts = {
		env: {},
		args: []
            };
        }
        for (key in opts.env) {
            envArr.push({
                'name': key,
                'value': opts.env[key]
            });
        }
        var rc = {
            "kind": "ReplicationController",
            "apiVersion": "v1",
            "metadata": {
                "name": name + "." + shard,
                "namespace": "default",
                "labels": {
                    "shard": "" + shard,
                    "service": name
                }
            },
            "spec": {
                "replicas": 1,
                "selector": {
                    "shard": "" + shard,
                    "service": name
                },
                "template": {
                    "metadata": {
                        "labels": {
                            "shard": "" + shard,
                            "service": name
                        }
                    },
                    "spec": {
                        "containers": [{
                            'name': service.name,
                            'image': serverHost + ':' + registryPort + '/' + namePrefix + '/' + name,
                            'imagePullPolicy': 'Always',
                            'command': ['node', '--harmony-proxies', path.basename(process.argv[1]), '--runner=kubernetes', 'serve', '' + port].concat(opts.args),
                            'ports': [{
                                'containerPort': port
                            }],
                            'env': envArr
                        }],
                        "restartPolicy": "Always",
                        "dnsPolicy": "ClusterFirst",
                    }
                }
            },
        }
        return rc;
    };

    var makeDeployment = function(name, service) {
        var port = 3000;
        var deployment = {
            'apiVersion': 'extensions/v1beta1',
            'kind': 'Deployment',
            'metadata': {
                'name': name
            },
            'spec': {
                'replicas': service.replicas,
                'template': {
                    'metadata': {
                        'labels': {
                            'app': name
                        }
                    },
                    'spec': {
                        'containers': [{
                            'name': service.name,
                            'image': serverHost + ':' + registryPort + '/' + name,
                            'command': ['node', '--harmony-proxies', path.basename(process.argv[1]), '--runner=kubernetes', 'serve', '' + port],
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
                    'targetPort': 3000
                }]
            }
        }

        return service;
    }

    var runKubernetesServiceDeployment = function(name, service, opts) {
        runKubernetesCommand('kubectl create -f -', makeDeployment(name, service));
        runKubernetesCommand('kubectl create -f -', makeService(name, {
            'app': name
        }));
    };

    var runKubernetesServiceReplicationController = function(name, service, opts) {
        for (var i = 0; i < service.replicas; i++) {
            labels = {
                'service': name,
                'shard': '' + i
            }
            runKubernetesCommand('kubectl create -f -', makeReplicationController(name, service, i, opts));
            runKubernetesCommand('kubectl create -f -', makeService(name + '-' + i, labels));
        }
    };

    var runKubernetesCommand = function(cmd, obj) {
        var child = execFn(cmd, {}, function(err, stdout, stderr) {
            log.debug(`${stdout}`);
            if (err !== null) {
                log.error(`stderr: ${stderr}`);
                log.error(`exec error: ${err}`);
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

    var deleteKubernetesServiceDeployment = function(name, service) {
        runKubernetesCommand('kubectl delete -f -', makeDeployment(name, service));
        runKubernetesCommand('kubectl delete -f -', makeService(name, {
            'app': name
        }));
    };

    var deleteKubernetesServiceReplicationController = function(name, service) {
        for (var i = 0; i < service.replicas; i++) {
            runKubernetesCommand('kubectl delete -f -', makeReplicationController(name, service, i));
            runKubernetesCommand('kubectl delete -f -', makeService(name + '-' + i, {}));
        }
    };

    /**
     * Get the hostname of a shard in a particular service.
     * Called at runtime.
     * @param {string} serviceName The name of the service to get the hostname for.
     * @param {number} shard The integer number of the shard
     */
    module.exports.getHostname = function(serviceName, shard) {
        return serviceName.replace('.', '-') + '-' + shard + '.default.svc';
    };
}());
