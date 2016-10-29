// Import the metaparticle library
var mp = require('metaparticle');

// Create a simple service.
var service = mp.service(
    "simple-service",
    // @param {Object} request is an in-bound JSON body from a POST
    // returns {Object} serialized to HTTP and sent back as the response
    function (request) {
        return { "request-was": request };
    }
);

// Expose this service on the network
service.expose = true;

// Start serving
mp.serve();
