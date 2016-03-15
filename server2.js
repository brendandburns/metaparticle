var mp = require('./metaparticle');
var runner = require('./metaparticle-print.js')
//var runner = require('./metaparticle-docker.js')

mp.service(
        "my-scatter-gather",
	mp.scatter(3, function(data) {
		return {"A": "c"};
	},
	function(responses) {
		var merged = [];
		for (var i = 0; i < responses.length; i++) {
			merged.push(responses[i]);
		}
		return merged;
       }));

mp.serve(runner);
