var mp = require('./metaparticle');

mp.service(
	mp.scatter(3, function(data) {
		return {"A": "a"};
	},
	function(responses) {
		var merged = [];
		for (var i = 0; i < responses.length; i++) {
			merged.push(responses[i]);
		}
		return merged;
       }));

mp.serve();
