// Import the main library
var mp = require('../metaparticle');

// A simple function for calculating a Gaussian distributed value
// from a uniform random value
var gaussian = function(sigma, mean) {
    var u1 = 2 * Math.PI * Math.random();
    var u2 = -2 * Math.log(Math.random());
    var n = Math.sqrt(u2) * Math.cos(u1);
    return n * sigma + mean;
};

// This function is executed on each leaf
var leafFunction = function(data) {
    var result = { 'n': [] };
    for (var i = 0; i < 100; i++) {
        result.n.push(gaussian(25, 100));
    }
    return result;
};

// This function is executed on each root
var mergeFunction =  function(responses) {
    var histogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var i = 0; i < responses.length; i++) {
        for (var j = 0; j < responses[i].n.length; j++) {
            if (responses[i].n < 0 || responses[i].n > 200) {
	        continue
	    }
	    var ix = Math.floor(responses[i].n[j] / 20);
	    histogram[ix]++;
	}
    }
    return histogram;
};

var svc = mp.service(
    // name of the service
    "histogram-service",
    // library function that creates a scatter/gather service
    mp.scatter(10, leafFunction, mergeFunction));

// Expose the root service to the world
svc.subservices.gather.expose = true;

// And serve
mp.serve();
