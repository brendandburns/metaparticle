var mp = require('../metaparticle');

var service = mp.service(
    "simple-service",
    function(request) {
	return {"A": request};
    }
);
service.expose = true;

mp.serve();
