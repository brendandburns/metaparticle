var mp = require('../metaparticle');

mp.service(
    "simple-storage",
    function(request) {
	if (!mp.scope.global.requests) {
		mp.scope.global.requests = 0;
	}
	mp.scope.global.requests++;
	return {"requests": mp.scope.global.requests};
    }
);

mp.serve();
