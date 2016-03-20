var test = require('unit.js');

describe('service', function() {
    var mp;

    before(function(done) {
        this.timeout(10000);
        mp = require('../metaparticle');
        done();
    });

    it('should name a service', function() {
        var name = 'test';
        var service = mp.service(name, function() {});
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

    it('should shard', function() {
        mp.injectClientFactoryForTesting(function(host) {
            test.string(host).is("http://my-service.compute.3:3000");
            return {
                request: function(method, request, callback) {
                    test.string(method).is('shard');
                    callback(null, {
                        'baz': 'blah'
                    });
                }
            }
        });

        mp.injectRunEnvironmentForTesting({
            getHostname: function(service, shard) {
                test.number(shard).is(3);
                test.string(service).is('my-service.compute');
                return service + '.' + shard;
            }
        });
	var input = {'foo': 'bar'};
        var service = mp.shard(5,
            function(data) {
		test.object(data).is(input);
                return 3;
            },
            function(data) {
                return data;
            });
        mp.service('my-service', service);

        service.fn(function(err, data) {
            test.undefined(err).undefined();
            test.object(data).is({
                'baz': 'blah'
            });
        }, input);
    });

    it('should scatter/gather', function() {
        var serviceShards = [];
        var hosts = [];
        mp.injectClientFactoryForTesting(function(host) {
            var dotIx = host.lastIndexOf('.');
            test.number(dotIx).isNot(-1);
            var hostName = host.substring(0, dotIx);
            var number = host.substring(dotIx + 1);
            test.string(hostName).is('http://my-service.scatter');
            test.string(number).isValid(/[0-2]:3000/);
            hosts.push(host);
            var ix = 0;
            return {
                request: function(method, request, callback) {
                    test.string(method).is('scatter');
                    ix++;
                    callback(null, {
                        'count': ix
                    });
                }
            };
        });
        mp.injectRunEnvironmentForTesting({
            getHostname: function(service, shard) {
                serviceShards.push({
                    'service': service,
                    'shard': shard
                });
                return service + "." + shard;
            }
        });

        var service = mp.scatter(3, function(data) {
            return data;
        }, function(list) {
            return list;
        });

        mp.service('my-service', service);

        service.fn(function(err, data) {
            test.undefined(err).undefined();
	    test.array(data).is([
		    {'count': 1},
		    {'count': 2},
		    {'count': 3}
	    ]);
        }, {
            'foo': 'bar'
        });

        test.number(hosts.length).is(3);
    });
});
