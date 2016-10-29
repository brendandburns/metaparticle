(function () {
    var q = require('q');
    var redis = require('node-redis-client');
    //var op = require('objectpool');

    var makeRedisClient = function () {
        var opts = {
            host: process.env['REDIS_HOST']
        };
        c = new redis(opts);
        c.on('connect', function () {
            console.log('connected');
        });
        return c;
    }

    //var generator = op.generator(makeRedisClient);
    var injectClient = null;
    var client = function () {
        if (injectClient != null) {
            return injectClient;
        }
        return makeRedisClient();
    };

    module.exports.injectClientForTesting = function (client) {
        injectClient = client;
    }

    /**
     * A note on the 'data' package:
     * This library expects to store and load objects of the form:
     * {
     *   'data': <some-js-object>,
     *   'version': <string>
     * }
     *
     * Where 'version' is a string that is used for optimistic concurrency.
     */

    /**
     * Load a particular data scope and return it
     * @param {string} scope The scope to load
     * @returns A promsie for the data for that scope.
     */
    module.exports.load = function (scope) {
        var deferred = q.defer();
        var obj = {};

        var c = client();
        // TODO: Probably need a MULTI here
        c.call('GET', 'value', function (err, res) {
            console.log('baz');
            if (err) {
                deferred.reject(err);
                return;
            }
            console.log(res);
            if (res != null) {
                deferred.resolve(JSON.parse(res));
            } else {
                console.log('resolving null');
                deferred.resolve({
                    'data': {},
                    'version': 0
                });
            }
        });

        return deferred.promise;
    }

    /**
     * Store the data to persistent storage.
     * @param {string} scope The scope to store
     * @param {data} data The data package
     * @returns A promise that resolves with true if the storage succeeded, false otherwise.
     */
    module.exports.store = function (scope, data) {
        var deferred = q.defer();

        // TODO: NEED TO MAKE SURE THIS IS ALL ONE ATOMIC BLOCK IN THE JS
        // ALTERNATELY, JUST CREATE A NEW CLIENT FOR EACH STORE.

        var id = Math.floor(Math.random() * 1000);
        console.log(id + " redis store");
        var c = client();
        // TODO: Turn this into it's own function that returns a promise, and then release in that
        // promise.
        c.call('WATCH', 'value', function (err) {
            console.log(id + " redis store 2 " + err);

            if (err) {
                deferred.reject(err);
                return
            }

            c.call('GET', 'value', function (err, res) {
                console.log(id + " redis store 3 " + err);

                try {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    if (res == null && data.version != "0") {
                        //deferred.reject(new Error("version mismatch"));
                        deferred.resolve(false);
                        return;
                    }
                    console.log(id + " redis store 3.5");
                    if (res != null) {
                        var obj = JSON.parse(res);
                        console.log(id + ' checking: ' + obj.version + " vs " + data.version);
                        if (obj.version != data.version) {
                            deferred.resolve(false);
                            return;
                            //deferred.reject(new Error('version mismatch: ' + data.version + ' vs. ' + res));
                        }
                    }
                    data.version = data.version + 1;

                    c.call('MULTI', function () {
                        c.call('SET', 'value', JSON.stringify(data), function () {
                            c.call('EXEC', function (err, res) {
                                console.log(id + " redis store 4 " + err);
                                if (err) {
                                    console.log(id + ' rejected: ' + err);
                                    //deferred.reject(err);
                                    deferred.resolve(false);
                                    return;
                                }
                                if (res == null) {
                                    console.log(id + ' rejected: null');
                                    deferred.resolve(false);
                                    return;
                                }
                                console.log(id + ' result was: ' + res);
                                console.log(id + ' resolving true');
                                deferred.resolve(true);
                            });
                        });
                    });
                } catch (ex) {
                    console.log(ex);
                }
            });
        });

        return deferred.promise;
    }
} ());
