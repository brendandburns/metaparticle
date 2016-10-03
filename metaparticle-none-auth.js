(function() {
    var q = require('q');
    /**
     * Authenticate an HTTP request and return a message that includes a
     * 'user' field.
     * @param {Object} req A node.js HTTP request object
     * @returns A promise for the data for the authenticated user.
     */
    module.exports.auth = function(req) {
	return q.fcall(function() {
	    return {
		'user': 'unknown'
	    };
	});
    }
}());
