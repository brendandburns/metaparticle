(function () {
    // builtins
    var path = require('path');

    // installed
    var q = require('q');
    var log = require('loglevel');

    var c = null;

    var client = function () {
        if (c == null) {
            var docker = require('dockerode');
            c = new docker({
                socketPath: '/var/run/docker.sock'
            });
        }
        return c;
    }

    module.exports.getHostname = function (serviceName, shard) {
        return serviceName + '.' + shard;
    }

    // TODO: unify this code in one place.
    var prefix = process.env['DOCKER_IMAGE_PREFIX'];
    if (!prefix) {
        prefix = 'metaparticle';
    }

    var imageName = 'metaparticle';

    module.exports.build = function () {
        var img = prefix + '/' + imageName;
        return module.exports.buildImage(img, process.cwd());
    }

    var tar = null;
    module.exports.buildImage = function (name, dir) {
        log.info("building image (this may take a bit)");
        if (tar == null) {
            tar = require('tar-fs');
        }
        var defer = q.defer();
        var tarStream = tar.pack(dir);
        client().buildImage(tarStream, {
            t: name
        }, function (err, output) {
            if (err) {
                defer.reject(err);
            } else {
                output.on('data', function(chunk) {
                    log.debug(chunk.toString());
                });
                //output.pipe(process.stdout, {
                //    end: true
                //});
                output.on('end', function () {
                    log.info("building image done.");
                    defer.resolve(null);
                });
            }
        });
        return defer.promise;
    };

    module.exports.pushImage = function (name, host) {
        var defer = q.defer();
        var img = client().getImage(name);
        img.push({
            'registry': host + ':5000'
        },
            function (err, output) {
                if (err) {
                    defer.reject(err);
                    return;
                }
                output.pipe(process.stdout, {
                    end: true
                });
                output.on('end', function () {
                    defer.resolve(null);
                });
            });

        return defer.promise;
    };

    module.exports.delete = function (services) {
        var promise = recursiveDelete([], services);
        promise.then(function () {
            deleteNetwork('mp-network').done();
        }).done();
    };

    var deleteNetwork = function (name) {
        var deferred = q.defer();
        var network = client().getNetwork(name);
        network.remove({}, function (err, data) {
            if (err) {
                if (err.statusCode == 404) {
                    deferred.resolve(null);
                } else {
                    deferred.reject(err);
                }
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    };

    var recursiveDelete = function (prefix, services) {
        var promises = [];
        for (var key in services) {
            var service = services[key];
            prefix.push(service.name);
            if (service.subservices) {
                promises.push(recursiveDelete(prefix, service.subservices));
            } else {
                promises.push(deleteDocker(service, prefix.join(".")));
            }
            prefix.pop();
        }
        return q.all(promises);
    };

    var deleteDocker = function (service, name) {
        var promises = [];
        for (var i = 0; i < service.replicas; i++) {
            promises.push(deleteReplica(name + "." + i));
        }
        return q.all(promises);
    };

    var deleteReplica = function (name) {
        var deferred = q.defer();
        var container = client().getContainer(name);
        container.inspect({}, function (err, data) {
            if (err != null) {
                if (err.statusCode == 404) {
                    console.log("couldn't find it!");
                    deferred.resolve(null);
                } else {
                    deferred.reject(err);
                }
                return;
            }
            var promise;
            if (data.State.Running) {
                promise = killContainer(container);
            } else {
                promise = removeContainer(container);
            }
            promise.then(
                function (data) {
                    deferred.resolve();
                },
                function (err) {
                    deferred.reject(err);
                });
        });
        return deferred.promise;
    };

    var killContainer = function (container) {
        var deferred = q.defer();
        // todo, this should really be a chained promise.
        container.kill({}, function (err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                removeContainer(container).then(
                    function (data) { deferred.resolve(data); },
                    function (err) { deferred.reject(err); });
            }
        });
        return deferred.promise;
    };

    var removeContainer = function (container) {
        var deferred = q.defer();
        container.remove({}, function (err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    };

    module.exports.run = function (services, args, env) {
        var promise = createNetwork('mp-network');
        promise.then(function (network) {
            recursiveRun([], services, network, args, env);
        });
    }

    var createNetwork = function (name) {
        var deferred = q.defer();
        client().createNetwork({
            "Name": name,
            "Driver": "bridge",
            "IPAM": {
                "Config": [{
                    "Subnet": "172.21.0.0/16",
                    "IPRange": "172.21.12.0/24",
                    "Gateway": "172.21.12.11"
                }]
            },
            "Internal": true
        }, function (err, data) {
            if (err) {
                log.error("Error creating network: " + err);
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    };

    var recursiveRun = function (prefix, services, network, args, env) {
        for (var key in services) {
            var service = services[key];
            prefix.push(service.name);
            if (service.subservices) {
                recursiveRun(prefix, service.subservices, network, args, env);
            } else {
                runDocker(service, prefix.join("."), network, args, env);
            }
            prefix.pop();
        }
    }

    var runDocker = function (service, name, network, args, env) {
        var replicas = service.replicas;
        if (!replicas) {
            replicas = 1;
        }
        for (var i = 0; i < replicas; i++) {
            runReplica(service, name + "." + i, network, args, env);
        }
    };

    var runReplica = function (service, name, network, args, env) {
        var deferred = q.defer();
        var envArr = [];
        for (key in env) {
            envArr.push(key + "=" + env[key]);
        }
        var createOpts = {
            Image: prefix + '/' + imageName,
            Cmd: ['node', '--harmony-proxies', '/' + path.basename(process.argv[1]), '--runner=docker', 'serve', '3000'].concat(args),
            name: name,
            ExposedPorts: {
                '3000/tcp': {}
            },
            Env: envArr
        };

        if (service.expose) {
            createOpts.PortBindings = {
                '3000/tcp': [{
                    'HostPort': '3000'
                }]
            };
        }
        client().createContainer(createOpts,
            function (err, container) {
                if (err) {
                    log.error('error creating: ' + err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(container);
                }
            });

        var deferred2 = q.defer();
        deferred.promise.then(
            function (container) {
                var startOpts = {};
                container.start(startOpts,
                    function (err, data) {
                        if (err) {
                            log.error('error starting container: ' + err);
                            deferred2.reject(err);
                        } else {
                            deferred2.resolve(container);
                        }
                    });
            }).done();
        deferred2.promise.then(
            function (data) {
                network.connect({
                    "Container": data.id
                }, function (err, data) {
                    if (err) {
                        log.error('error connecting network: ' + err);
                    }
                });
            }).done();
    };
} ());
