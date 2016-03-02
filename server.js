var mp = require('./metaparticle');
var runner = require('./metaparticle-docker');
//var runner = require('./metaparticle-print');

mp.service(
    "simple-service",
    function(request) {
	return {"A": request};
    }
);

mp.serve(runner);
