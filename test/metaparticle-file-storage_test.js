var test = require('unit.js');

describe('file-storage', function() {
    var mfs;
    var scope;

    before(function(done) {
        this.timeout(10000);
        mp = require('../metaparticle-file-storage');
        scope = 'scope-' + Math.floor(Math.random() * 10000);
        done();
    });

    afterEach(function(done) {
        require('fs').unlink(scope + '.json', function() {
            done();
        });
    })

    it('should return empty if no such scope', function(done) {
        var promise = mp.load('no-such-scope');
        promise.then(function(data) {
                test.object(data.data).is({});
                test.string(data.version).is('empty');
                done();
            },
            function(err) {
                // This should never be called.
                test.assert.fail(err);
                done();
            }).done();
    });

    it('should be able to write if it was empty', function(done) {
        var promise = mp.store(scope, {
            data: {},
            version: 'empty'
        });
        promise.then(function(success) {
                test.bool(success).isTrue();
                done();
            },
            function(err) {
                test.assert.fail(err);
                done();
            }).done();
    });

    it('should round trip successfully', function(done) {
        var obj = {
            'foo': 'bar',
            'baz': 'blah'
        };

        var promise = mp.store(scope, {
            'data': obj,
            'version': 'empty'
        });

        promise.then(function() {
            mp.load(scope).then(function(loaded) {
                test.object(loaded.data).is(obj);
                done();
            }).done();
        }).done();
    });

    it('should fail if there is a conflict non-exist', function(done) {
        var obj = {
            'foo': 'bar'
        };
        var promise = mp.store(scope, {
            'data': obj,
            'version': 'non-empty-version'
        });

        promise.then(function(success) {
                test.bool(success).isFalse();
                // TODO: test here that no file was written
                done();
            },
            function(err) {
                test.assert.fail(err);
                done();
            }).done();
    });

    it('should fail if there is a conflict exist', function(done) {
        var obj = {
            'foo': 'bar',
            'baz': 'blah'
        };

        var data = {
            'data': obj,
            'version': 'empty'
        };

        var promise = mp.store(scope, data);

        promise.then(function(success) {
            test.bool(success).isTrue();
            return mp.store(scope, data);
        }).then(function(success) {
            test.bool(success).isFalse()
            done()
        }).done();
    });

    it('should fail if there is a conflict different version', function(done) {
        var obj = {
            'foo': 'bar',
            'baz': 'blah'
        };

        var data = {
            'data': obj,
            'version': 'empty'
        };

        var promise = mp.store(scope, data);

        promise.then(function(success) {
            test.bool(success).isTrue();
            return mp.load(scope, data);
        }).then(function(data) {
	    data.version = 'no-such-version';
	    data.data['foo'] = 'baz';
	    return mp.store(scope, data);
	}).then(function(success) {
            test.bool(success).isFalse();
            done()
        }).done();
    });
});
