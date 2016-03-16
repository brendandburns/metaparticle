// The interface for a metaparticle implementation.
// Not expected to be used, just for documentation
(function() {
    /**
     * Build all images described in this application
     * @returns A promise (using 'q') that is completed when the build is done.
     */
    module.exports.build = function() {
        return q.fcall(function(){});
    };

    /**
     * Run the described application
     */
    module.exports.run = function(services) {};

    /**
     * Delete the described application
     */
    module.exports.delete = function(services) {};

    /**
     * Get the hostname of a shard in a particular service.
     * Called at runtime.
     * @param {string} serviceName The name of the service to get the hostname for.
     * @param {number} shard The integer number of the shard
     */
    module.exports.getHostname = function(serviceName, shard) {
	return serviceName + '.' + shard;
    };
}());
