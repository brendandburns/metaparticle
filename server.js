var mp = require('./metaparticle');

mp.service(
    function(request) {
	return {"A": request};
    }
);

mp.serve();
