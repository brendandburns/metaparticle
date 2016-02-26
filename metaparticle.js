(function() {
    var jayson = require('jayson');
    var client = jayson.client.http({port:3000});
    var q = require('q');

    var handlers = [];
    var server;

    module.exports.service = function(fn) {
       handlers['add'] = function(args, callback) {
              if (!fn.async) {
                   callback(null, fn.apply(null, args));
              } else {
		   var params = [callback];
		   for (var i = 0; i < args.length; i++) {
			params.push(args[i]);
		   }
                   fn.fn.apply(null, params);
              }
          };
    };

    var requestPromise = function(client, data) {
    	var defer = q.defer();
        client.request('scatter', [data], function(err, response) {
              if (err) {
		defer.reject(err);
	      } else {
		defer.resolve(response.result);
              }
        });
	return defer.promise;
    }; 

    module.exports.scatter = function(shards, scatterFn, gatherFn) {
        handlers['scatter'] = function(args, callback) {
		callback(null, scatterFn.apply(null, args));
        }
	return {
            async: true,
            fn: function(callback, data) {
                var results = ['a', 'b'];
		var promises = [];
		for (var i = 0; i < shards; i++) {
			promises.push(requestPromise(client, data));
                }
                q.all(promises).then(
		function(data) {
			callback(null, gatherFn(data));
		},
		function(err) {
			callback(err, null)
		});
           }
	};
    };

    module.exports.serve = function(runner) {
	if (process.argv[2] == 'serve') {
          	var server = jayson.server(handlers);
		server.http().listen(parseInt(process.argv[3]));
        } else {
		runner.run();
	}
    };
}());

