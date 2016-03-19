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
});
