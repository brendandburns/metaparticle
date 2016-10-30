## Metaparticle Code Walk, Chapter 6

Previously we have seen how metaparticle can simplify storage, but the example was
drawn from a single instance. In this example, we extend this to a replicated service.
Because this is a replicated service, we need a shared data store.  In this case
we're going to use the Redis data store.

If you went through the previous example, then you already have an instance of Redis running.

If you don't have a redis instance running, you can run one with:

```console
$ docker run -d --net=host redis
```

Then set the `REDIS_HOST` environment variable to point to the IP address of your machine.

*note*: it is important that this is the true IP address (e.g. `192.168.1.1`), not localhost (`127.0.0.1`)

Now run the following server:

```js
var mp = require('metaparticle');
var os = require('os');

var numReplicas = 3;

var service = mp.service(
	"replicated-storage-service",
	// A service that is spread amongst 3 replicas
	mp.spread(
		numReplicas,
		function serviceFunction(data) {
			if (!mp.scope.global.requests) {
				mp.scope.global.requests = 0;
			}
			mp.scope.global.requests++;
			return {
				"requests": mp.scope.global.requests,
				"server": os.hostname()
			};
		}
	)
);

service.subservices.shard.expose = true;

mp.serve();
```

```console
node server6.js --storage=redis
```

Now access this with:
```console
$ for x in 0 1 2 3 4 5 6 7 8 9; do
   node client.js replicated-storage-service
done
```

Note that while the hostnames returned are different, the request count continues to update correctly.

As before, you can send multiple parallel requests to the different servers and the request counts
continue to update correctly:

```console
$ for x in 0 1 2 3 4 5 6 7 8 9; do
   node client.js replicated-storage-service &
done
```

Before you move on, remember to tear down your service:

```console
$ node server6.js delete
```
