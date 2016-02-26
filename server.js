var mp = require('./metaparticle');
var runner = require('./metaparticle-docker');

mp.service(
    function(request) {
	return {"A": request};
    }
);

mp.serve(runner);
