var mp = require('./metaparticle');
var os = require('os');

var gaussian = function(sigma, mean) {
    var u1 = 2 * Math.PI * Math.random();
    var u2 = -2 * Math.log(Math.random());
    var n = Math.sqrt(u2) * Math.cos(u1);
    return n * sigma + mean;
};


mp.service(
    "my-service",
    mp.scatter(10, function(data) {
	    var numbers = [];
	    for (var i = 0; i < 100; i++) {
	      numbers.push(gaussian(25, 100));
	    }
            return {
                'n': numbers,
            };
        },
        function(responses) {
            var histogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            for (var i = 0; i < responses.length; i++) {
		for (var j = 0; j < responses[i].n.length; j++) {
                    if (responses[i].n < 0 || responses[i].n > 200) {
                        continue
                    }
                    var ix = Math.floor(responses[i].n[j] / 20);
                    histogram[ix]++;
		}
            }
            return histogram;
        }));

mp.serve();
