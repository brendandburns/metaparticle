(function() {
    var q = require('q');
    var path = require('path');
    var docker = require('dockerode');
    var log = require('loglevel');
    var client = new docker({
        socketPath: '/var/run/docker.sock'
    });

    module.exports.getHostname = function(serviceName, shard) {
        return serviceName + '.' + shard;
    }

    module.exports.build = function() {
        var img = 'brendandburns/metaparticle';
        return module.exports.buildImage(img, process.cwd());
    }

    module.exports.buildImage = function(name, dir) {
        var tar = require('tar-fs');
        var defer = q.defer();
        var tarStream = tar.pack(dir);
        client.buildImage(tarStream, {
            t: name
        }, function(err, output) {
            if (err) {
                defer.reject(err);
            } else {
                output.pipe(process.stdout, {
                    end: true
                });
                output.on('end', function() {
                    defer.resolve(null);
                });
            }
        });
        return defer.promise;
    };

    module.exports.pushImage = function(name, host) {
        var defer = q.defer();
        var img = client.getImage(name);
        img.push({
                'registry': host + ':5000'
            },
            function(err, output) {
                if (err) {
                    defer.reject(err);
                    return;
                }
                output.pipe(process.stdout, {
                    end: true
                });
                output.on('end', function() {
                    defer.resolve(null);
                });
            });

        return defer.promise;
    };

    module.exports.delete = function(services) {
        var promise = recursiveDelete([], services);
        promise.then(function() {
            deleteNetwork('mp-network').done();
        }).done();
    };

    var deleteNetwork = function(name) {
        var deferred = q.defer();
        var network = client.getNetwork(name);
        network.remove({}, function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    };

    var recursiveDelete = function(prefix, services) {
        var promises = [];
        for (var key in services) {
            var service = services[key];
            prefix.push(service.name);
            if (service.subservices) {
                recursiveDelete(prefix, service.subservices);
            } else {
                promises.push(deleteDocker(service, prefix.join(".")));
            }
            prefix.pop();
        }
        return q.all(promises);
    };

    var deleteDocker = function(service, name) {
        var promises = [];
        for (var i = 0; i < service.replicas; i++) {
            promises.push(deleteReplica(name + "." + i));
        }
        return q.all(promises);
    };

    var deleteReplica = function(name) {
        var deferred = q.defer();
        var container = client.getContainer(name);

        // todo, this should really be a chained promise.
        container.kill({}, function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                container.remove({}, function(err, data) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(data);
                    }
                });
            }
        });
        return deferred.promise;
    };

    module.exports.run = function(services) {
        var promise = createNetwork('mp-network');
        promise.then(function(network) {
            recursiveRun([], services, network);
        });
    }

    var createNetwork = function(name) {
        var deferred = q.defer();
        client.createNetwork({
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
        }, function(err, data) {
            if (err) {
                log.error("Error creating network: " + err);
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
        client.createContainer({
                Image: 'brendandburns/metaparticle',
                Cmd: ['node', '/' + path.basename(process.argv[1]), '--runner=docker', 'serve', '3000'],
                name: name,
                ExposedPorts: {
                    '3000/tcp': {}
                }
            },
            function(err, container) {
                if (err) {
                    log.error('error creating: ' + err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(container);
                }
            });

        var deferred2 = q.defer();
        deferred.promise.then(
            function(container) {
                container.start({
                        //"PortBindings": { "3000/tcp": [{ "HostPort": "3000" }] }
                    },
                    function(err, data) {
                        if (err) {
                            log.error('error starting container: ' + err);
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
                        log.error('error connecting network: ' + err);
                    }
                });
            }).done();
    };
}());
