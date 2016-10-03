(function() {
    var q = require('q');
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
     * @returns A promise for the data for that scope.
     */
    module.exports.load = function(scope) {
	    return q.fcall(function() {
	    	return {
			'data': {},
			'version': '1'
		};
	    });
    }

    /**
     * Store the data to persistent storage.
     * @param {string} scope The scope to store
     * @param {data} data The data package
     * @returns A promise that resolves with true if the storage succeeded, false otherwise.
     */
    module.exports.store = function(scope, data) {
        return q.fcall(function() { return false; });
    }
}());
