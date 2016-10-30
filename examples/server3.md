## Metaparticle Code Walk, Chapter 3

Ok, in [chapter 2](server2.md) we began to see how to define infrastructure as code.  In this
chapter we're going to explore a slightly more complicated
[server pattern](/docs/service-patterns,md): sharding.

If you haven't encountered sharding before, the basic idea is to split up all of your requests
based on some property of the request so that they all go to the same server. There are a number
of reasons that you may want to do this, one benefit is that you will have better cache hit
rates (since all requests for one user go to the same service) while still replicating for
reliability, additionally you can use sharding to evenly spread storage across a set of replicas
while maintaining a different storage shard at each replica.

Anyway, in Metaparticle you define a sharded service with the `mp.shard` function.  `mp.shard`
takes three parameters:
   * The number of shards
   * The sharding function that is run in the parent to determine which replica to use.
   * The service function to run at each replica.

Here's our same program, but now it's using sharding:

```javascript
var mp = require('metaparticle');
var os = require('os');

var numShards = 3;

// A sharded service that shards based on user-id length
var service = mp.service(
	"sharded-service",
	// Defines the sharded service
	mp.shard(
		numShards,
		function shardingFunction(data) {
			try {
				return data.user.length % numShards;
			} catch (ex) {
				return 0;
			}
		},
		function serviceFunction(data) {
			return {
				"request": data,
				"server": os.hostname()
			};
		}));

service.subservices.shard.expose = true;

mp.serve();
```

You run this service the same way as you've run all of the others:

```console
node server3.js
```

If you run `docker ps` you'll see nothing appears to have changed from the previous example.
There are still four containers, three replicas and a parent. What's changed is the code
running in the parent.

To see this change, run that same loop you did before:

```console
$ for x in 0 1 2 4 5 6 7 8 9; do 
    node client.js sharded-service
  done
```

This time, you should see that all of your requests are hitting the same server:

```console
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
{"request":{"foo":"bar"},"server":"3f28b69d4e5c"}
```

To experiment with the sharding, try passing other parameters to the service:
```console
$ node client.js sharded-service '{"user": "me"}'
{"request":{"user":"me"},"server":"c90f964633be"}

$ node client.js sharded-service '{"user": "me, eloise"}'
{"request":{"user":"me, eloise"},"server":"8afc48f73d0e"}
```

Remember to tear down your service:

```console
node server3.js delete
```

Ok, let's move on to our final distributed service pattern in [chapter 4](server4.md).
