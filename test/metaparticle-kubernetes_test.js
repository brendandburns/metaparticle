var test = require('unit.js');

describe('kubernetes', function() {
    var mp;

    before(function(done) {
        this.timeout(10000);
        mp = require('../metaparticle-kubernetes');
        done();
    });

    var svcs = {
        'start': {
            'name': 'start',
            'subservices': {
                'a': {
                    'name': 'a',
                    'replicas': 1
                },
                'b': {
                    'name': 'b',
                    'subservices': {
                        '1': {
                            'name': '1',
                            'replicas': 1
                        },
                        '2': {
                            'name': '2',
                            'replicas': 1
                        }
                    }
                }
            }
        }
    };

    
    it('should run correctly', function() {
        testRecursiveCommand('kubectl create -f -', mp.run);
    });

    it('should delete correctly', function() {
        testRecursiveCommand('kubectl delete -f -', mp.delete);
    });

    var testRecursiveCommand = function(cmdStr, op) {
        var calls = 0;
        var services = [];
        var serviceNames = [];
        var controllers = [];
        var controllerNames = [];
        mp.injectExecForTesting(function(cmd) {
            test.string(cmd).is(cmdStr);
            calls = calls + 1;
            return {
                'stdin': {
                    'write': function(data) {
                        var obj = JSON.parse(data);
                        if (obj.kind == "Service") {
                            services.push(obj);
                            serviceNames.push(obj.metadata.name);
                            return;
                        }
                        if (obj.kind == "ReplicationController") {
                            controllers.push(obj);
                            controllerNames.push(obj.metadata.name);
                            return;
                        }
                        test.fail("Unknown kind: " + obj.kind);
                    },
                    'end': function(data) {
                    }
                }
            };
        });

        // TODO: args and env here
        var args = {};
        var env = {};
        op(svcs, args, env);
        test.number(calls).is(6);
        test.array(services).hasLength(3);
        test.array(controllers).hasLength(3);

        var names = ['start-a', 'start-b-1', 'start-b-2'];
        for (var i = 0; i < names.length; i++) {
            test.array(serviceNames).contains([names[i] + '-0']);
            test.array(controllerNames).contains([names[i] + '.0']);
        }
    };

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
