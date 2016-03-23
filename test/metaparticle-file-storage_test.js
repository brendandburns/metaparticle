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

    after(function(done) {
        require('fs').unlink(scope + '.json', function() {
		done();
	});
    })

    it('should return empty if no such scope', function(done){
       var promise = mp.load('no-such-scope');
       promise.then(function(data) {
         test.object(data).is({});
         done();
       },
       function(err) {
	 // This should never be called.
         test.bool(false).isTrue();
	 done();
       }).done();
    });

    it('should round trip successfully', function(done) {
        var obj = {
            'foo': 'bar',
            'baz': 'blah'
        };

        var promise = mp.store(scope, obj);

        promise.then(function() {
            mp.load(scope).then(function(loaded) {
            	test.object(loaded).is(obj);
	    	done();
	    }).done();
        }).done();
    });
});
