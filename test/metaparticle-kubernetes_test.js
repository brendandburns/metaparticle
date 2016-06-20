var test = require('unit.js');

describe('kubernetes', function() {
    var mp;

    before(function(done) {
        this.timeout(10000);
        mp = require('../metaparticle-kubernetes');
        done();
    });

    it('should get hostname', function() {
        var tests = [{
            'service': 'foo',
            'shard': 0,
            'expected': 'foo-0.default.svc'
        }, {
            'service': 'foo.bar',
            'shard': 1,
            'expected': 'foo-bar-1.default.svc'
        }];

        for (var i = 0; i < tests.length; i++) {
            var t = tests[i];
            var out = mp.getHostname(t.service, t.shard);
            test.string(out).is(t.expected);
        }
    });

    it('should recurse correctly', function() {
        var tests = [{
            'services': {
                'start': {
                    'name': 'start',
                    'subservices': {
                        'a': {
                            'name': 'a'
                        },
                        'b': {
                            'name': 'b',
                            'subservices': {
                                '1': {
                                    'name': '1'
                                },
                                '2': {
                                    'name': '2'
                                }
                            }
                        }
                    }
                }
            },
            'paths': ['start-a', 'start-b-1', 'start-b-2']
        }];

        for (var i = 0; i < tests.length; i++) {
            var t = tests[i];
            var o = {
                'foo': 'bar'
            };
            var paths = [];

            var fn = function(name, service, opts) {
                test.object(opts).is(o);
                paths.push(name);
            };
            mp.recursiveFnForTesting([], t.services, fn, o);
            test.array(paths).is(t.paths);
        }
    });
});