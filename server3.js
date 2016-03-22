var mp = require('./metaparticle');

mp.service(
    "simple-storage",
    function(request) {
	if (!mp.global.requests) {
		mp.global.requests = 0;
	}
	mp.global.requests++;
	return {"requests": mp.global.requests};
    }
);

mp.serve();
