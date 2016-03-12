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

});

	
		
