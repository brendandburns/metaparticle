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
    // Canonical list of defined services 
    var services = {};

    module.exports.global = {};

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
                var promise = requestPromise(serviceName, 'shard', shard, data);
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

    module.exports.serve = function() {
        var argv = require('minimist')(process.argv.slice(2));
        var runSpec = argv['runner'];
        if (!runSpec || runSpec.length == 0) {
            runSpec = 'kubernetes';
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
            log.info(handlers);
            var server = jayson.server(handlers);
            server.http().listen(parseInt(argv._[1]));
        } else if (cmd == 'delete') {
            runEnvironment.delete(services);
        } else {
            var promise = runEnvironment.build();
            promise.then(function() {
                runEnvironment.run(services);
            }).done();
        }
    };

    module.exports.print = function() {
        console.log(JSON.stringify(services, null, 4));
    }
}());
