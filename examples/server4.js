var mp = require('../metaparticle');

var service = mp.service(
    "simple-user-storage",
    mp.basicAuth(function(request) {
	if (!mp.scope.user.requests) {
	    mp.scope.user.requests = 0;
	}
	mp.scope.user.requests++;
	return {"requests": mp.scope.global.requests};
    });
);

service.expose = true;

mp.serve();
