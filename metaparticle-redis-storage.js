(function() {
    var q = require('q');
    var redis = require('node-redis-client');

    var c = null;
    var client = function() {
        if (c == null) {
            c = new redis();
            c.on('connect', function() {
                console.log('connected');
            });
        }
        return c;
    };

    module.exports.injectClientForTesting(client) {
	    c = client;
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
    module.exports.load = function(scope) {
        var deferred = q.defer();
        var obj = {};

        client().call('GET', 'value', function(err, res) {
            if (err) {
                deferred.reject(err);
                return;
            }
            if (res != null) {
                obj = JSON.parse(res);
            }
        });

        client().call('GET', 'version', function(err, res) {
            if (err) {
                deferred.reject(err);
            }
            deferred.resolve({
                'data': obj,
                'version': res 
            });
        });

        return deferred.promise;
    }

    /**
     * Store the data to persistent storage.
     * @param {string} scope The scope to store
     * @param {data} data The data package
     * @returns A promise that resolves with true if the storage succeeded, false otherwise.
     */
    module.exports.store = function(scope, data) {
        var client = new redis({});
        var deferred = q.defer();

        client().call('SET', 'value', JSON.stringify(data.data), function(err, res) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(true);
            }
        });

        return deferred.promise;
    }
}());
