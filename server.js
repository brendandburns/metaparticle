var mp = require('./metaparticle');

mp.service(
    "simple-service",
    function(request) {
	return {"A": request};
    }
);

mp.serve();
