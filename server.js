var mp = require('./metaparticle');
// var runner = require('./metaparticle-docker');
// var runner = require('./metaparticle-print');
var runner = require('./metaparticle-kubernetes');

mp.service(
    "simple-service",
    function(request) {
	return {"A": request};
    }
);

mp.serve(runner);
