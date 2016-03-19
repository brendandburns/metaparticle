var test = require('unit.js');

describe('service', function() {
	var mp;

	before(function(done){
		this.timeout(10000);
		mp = require('../metaparticle');
		done();
	});

	it('should name a service', function() {
		var name = 'test';
		var service = mp.service(name, function() {
		});
		test.string(service.name).is(name);
	});

	it('should pass through to a function', function() {
		var calls = [] 
		var params = ['baz', 'blah'];
		var service = mp.service('test', function(arg1, arg2) {
			test.string(arg1).is(params[0]);
			test.string(arg2).is(params[1]);
			calls.push('main');

			return 'output';
		});

		service.fn(params, function(err, data) {
			test.string(data).is('output');
			calls.push('callback');
		});

		test.array(calls).is(['main', 'callback']);
	});

	it('should scatter/gather', function() {
		var serviceShards = [];
		var hosts = [];
		mp.injectClientFactoryForTesting(function(host) {
			hosts.push(host);
			return {
				request: function(method, request, callback) {
					test.string(method).is('scatter');
					callback(null, request);
				}
			};
		});
		mp.injectRunEnvironmentForTesting({
			getHostname: function(service, shard) {
				serviceShards.push({'service': service, 'shard': shard});
				return service + "." + shard;
			}
		});

		var service = mp.scatter(3, function(data) {
			return data;
		}, function(list) {
			return list;
		});

		service.fn(function(err, data) {
			test.number(data.length).is(3);
			// test values here.
		}, {'foo': 'bar'});

		test.number(hosts.length).is(3);
		// test values here
	});
});

	
		
