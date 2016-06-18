var mp = require('../metaparticle');

var service = mp.service(
    "simple-storage",
    function(request) {
	if (!mp.scope.global.requests) {
		mp.scope.global.requests = 0;
	}
	mp.scope.global.requests++;
	return {"requests": mp.scope.global.requests};
    }
);

service.expose = true;

mp.serve();
