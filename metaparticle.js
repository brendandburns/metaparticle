(function() {
    // libraries
    var jayson = require('jayson');
    var q = require('q');
    var util = require('./metaparticle-util.js')
    var log = require('loglevel');

    // implementation
    // Passed on to jayson, probably can be eliminated
    var handlers = [];
    // Forward reference to the runner implementation
    var runEnvironment;
    // Forward reference to the storage implementation
    var storageEnvironment;
    // Forward reference to the auth implementation
    var authEnvironment;

    // Canonical list of defined services 
    var services = {};
    // Scope variables
    module.exports.scope = {};
    module.exports.scope.globalData = {};
    module.exports.scope.globalDirty = false;

    module.exports.service = function(name, fn) {
        var service = {
            'name': name,
            'subservices': fn.services,
            'replicas': 1,
            'guid': util.makeGUID(),
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
        return service;
    };

    module.exports.injectRunEnvironmentForTesting = function(env) {
        runEnvironment = env;
    }

    module.exports.injectClientFactoryForTesting = function(factory) {
        makeClient = factory;
    };

    var makeClient = function(host) {
        return jayson.client.http(host)
    }

    var requestPromise = function(serviceName, method, shard, data) {
        var host = runEnvironment.getHostname(serviceName, shard);
        log.debug("connecting to: " + host)
        var client = makeClient("http://" + host + ":3000");
        var defer = q.defer();
        client.request(method, [data], function(err, response) {
            if (err) {
                log.error("Error contacting " + host + ": " + err);
                defer.reject(err);
            } else {
                defer.resolve(response.result);
            }
        });
        return defer.promise;
    };

    module.exports.spread = function(replicas, computeFn) {
        return module.exports.shard(replicas, function(data) {
            return Math.floor(Math.random() * replicas);
        }, computeFn);
    }

    module.exports.shard = function(shards, shardingFn, computeFn) {
        handlers['compute'] = function(args, callback) {
            callback(null, computeFn.apply(null, args));
        }
        var computeGUID = util.makeGUID();
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
                    'fn': function(data) {
                        return data;
                    },
                    'guid': util.makeGUID(),
                    'depends': ['compute'],
                    'replicas': 1
                }
            },
            async: true,
            fn: function(callback, data) {
                var shard = shardingFn(data) % shards;
                var serviceName = util.findServiceName(computeGUID, services);
                var promise = requestPromise(serviceName, 'compute', shard, data);
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
        var scatterGUID = util.makeGUID();
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
                    'guid': util.makeGUID(),
                    'depends': ['scatter'],
                    'replicas': 1,
                }
            },
            async: true,
            fn: function(callback, data) {
                var promises = [];
                for (var i = 0; i < shards; i++) {
                    var serviceName = util.findServiceName(scatterGUID, services);
                    promises.push(requestPromise(serviceName, 'scatter', i, data));
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

    var wrapHandler = function(handlerFn) {
        var failures = 0;
        var fn = function(args, callback) {
            log.debug('calling load');
            storeEnvironment.load('global').then(function(data) {
                var dirty = false;
		var Proxy = require('harmony-proxy');

                module.exports.scope.global = new Proxy(data.data, {
                    set: function(target, property, value) {
                        data.data[property] = value;
                        dirty = true;
                        return true;
                    }
                });
                log.debug('calling handler');
                handlerFn(args, function(err, fnData) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    if (dirty) {
                        log.debug('storing data');
                        storeEnvironment.store('global', data).then(function(success) {
                            log.debug('status: ' + success);
                            if (success) {
                                callback(null, fnData);
                            } else if (failures < 5) {
                                failures++;
                                setTimeout(function() {
                                    fn(args, callback);
                                }, 1000);
                            } else {
                                callback(new Error('failed to store data'), null);
                            }
                        }, function(err) {
                            callback(err, null);
                        });
                    } else {
                        log.debug('no changes');
                        callback(null, fnData);
                    }
                })
            }, function(err) {
                log.error('error: ' + err);
                callback(err, null);
            }).done();
        };
        return fn;
    }

    module.exports.serve = function() {
        var argv = require('minimist')(process.argv.slice(2));
        var runSpec = argv['runner'];
        if (!runSpec || runSpec.length == 0) {
            runSpec = 'docker';
        }
        var storeSpec = argv['storage'];
        if (!storeSpec || storeSpec.length == 0) {
            storeSpec = 'file';
        }
	var authSpec = argv['auth'];
	if (!authSpec || authSpec.length == 0) {
	    authSpec = 'none';
	}
        var logSpec = argv['logging'];
        if (logSpec) {
            switch (logSpec) {
                case 'trace':
                    log.setLevel(log.levels.TRACE);
                    break;
                case 'debug':
                    log.setLevel(log.levels.DEBUG);
                    break;
                case 'silent':
                    log.setLevel(log.levels.SILENT);
                    break;
                default:
                    log.warn('unknown log level: ' + logSpec + ' defaulting to INFO and up.');
                    log.setLevel(log.levels.INFO);
            }
        } else {
            log.info('setting log level to INFO, override with --logging.');
            log.setLevel(log.levels.INFO);
        }
        runEnvironment = require('./metaparticle-' + runSpec);
        var cmd = '';
        if (argv._ && argv._.length > 0) {
            cmd = argv._[0];
        }
        if (cmd == 'serve') {
            storeEnvironment = require('./metaparticle-' + storeSpec + '-storage.js');
	    authEnvironment = require('./metaparticle-' + authSpec + '-auth.js');
            log.info(handlers);

            for (var key in handlers) {
                var handlerFn = handlers[key];
                handlers[key] = wrapHandler(handlerFn);
            }

            var server = jayson.server(handlers);
	    server.on('http request', (req) => {
		console.log('http received');
		console.log(req);
		req.params = {
		    'foobar': 'baz'
		};
	    });
            server.http().listen(parseInt(argv._[1]));
        } else if (cmd == 'delete') {
            runEnvironment.delete(services);
        } else {
            // TODO: this is hacky.
            var promise = runEnvironment.build(services);

	    var env = {};
	    if (!argv['environment']) {
		env = process.env;
	    } else {
		env = util.makeMap(argv['environment']);
	    }
            promise.then(function() {
	        var args = [ '--storage=' + storeSpec ];
                runEnvironment.run(services, args, env);
            }).done();
        }
    };

    module.exports.print = function() {
        console.log(JSON.stringify(services, null, 4));
    }
}());
