(function() {
    var q = require('q');

    var file = null;

    var fs = function() {
        if (file == null) {
            file = require('fs');
        }
        return file;
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
     * @returns A promise for data for that scope
     */
    module.exports.load = function(scope) {
        var deferred = q.defer();
	var path = scope + ".json";
	// TODO: make this async too
	var stats = null;
	try {
		stats = fs().statSync(path);
	} catch (err) {
	        if (err.code != 'ENOENT') {
		  deferred.reject(err);
		  return;
		}
	}
	console.log(JSON.stringify(stats));
        fs().readFile(path, function(err, data) {
            if (err) {
		if (err.code == 'ENOENT') {
		  deferred.resolve({
		    'data': {},
		    'version': 'empty'
		  });
		} else {
                  deferred.reject(err);
		}
            } else {
                try {
                    var obj = JSON.parse(data);
                    deferred.resolve({
			    'data': obj,
		            'version': stats.mtime,
	            });
                } catch (ex) {
                    deferred.reject(ex);
                }
            }
        });
        return deferred.promise;
    }

    /**
     * Store the data to persistent storage.
     * @param {string} scope The scope to store
     * @param {data} data The data package
     * @returns A promise that resolves to true if the storage succeeded, false otherwise.
     */
    module.exports.store = function(scope, data) {
        var deferred = q.defer();
        var str = JSON.stringify(data.data);
        fs().writeFile(scope + ".json", str, function(err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    }
}());
