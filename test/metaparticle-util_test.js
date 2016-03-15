var test = require('unit.js');

describe('util', function() {
    var mp;

    before(function(done) {
        this.timeout(10000);
        mp = require('../metaparticle-util');
        done();
    });

    it("should make a name", function() {
        var tests = [{
            'test': [],
            'expected': ''
        }, {
            'test': ['foo'],
            'expected': 'foo'
        }, {
            'test': ['foo', 'bar'],
            'expected': 'foo.bar'
        }]

        for (var i = 0; i < tests.length; i++) {
            var out = mp.makeName(tests[i].test);
            test.string(out).is(tests[i].expected);
        }
    });

    it("should make a GUID", function() {
        var guid1 = mp.makeGUID();
        var guid2 = mp.makeGUID();

        // This can flake 1 in 100,000 runs
        test.string(guid1).isNot(guid2);
        var chars = '0123456789abcdef';
        for (var i = 0; i < guid1.length; i++) {
            var char = guid1.charAt(i);
            test.number(chars.indexOf(char)).isNot(-1);
        }
        for (var i = 0; i < guid2.length; i++) {
            var char = guid2.charAt(i);
            test.number(chars.indexOf(char)).isNot(-1);
        }
    });

    it("should find services", function() {
        var tests = [{
            'services': [],
            'guid': 'abc123',
            'expected': null,
        }, {
            'services': [{
                'name': 'foo',
                'guid': 'abc123'
            }],
            'guid': 'abc123',
            'expected': 'foo'
        }, {
            'services': [{
                'name': 'foo',
                'guid': 'abc123'
            }],
            'guid': 'abc1234',
            'expected': null
        }, {
            'services': [{
                'name': 'foo',
                'guid': 'abc123',
                'subservices': [{
                    'name': 'bar',
                    'guid': 'cde456',
                }]
            }],
            'guid': 'abc123',
            'expected': 'foo'
        }, {
            'services': [{
                'name': 'foo',
                'guid': 'abc123',
                'subservices': [{
                    'name': 'bar',
                    'guid': 'cde456',
                }]
            }],
            'guid': 'cde456',
            'expected': 'foo.bar'
        }];
        for (var i = 0; i < tests.length; i++) {
            var t = tests[i];
            var name = mp.findServiceName(t.guid, t.services);
            if (t.expected == null) {
                test.assert(name == null);
            } else {
                test.string(name).is(t.expected);
            }
        }
    });
});
