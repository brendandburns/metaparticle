## Metaparticle Code Walk, Chapter 2

So far, if you've run through [chapter1](server1.md), you may have some idea of how
Metaparticle works, but you may not really see the point, after all, it's just a slightly
more complicated version of something you could already do.

In addition to the notion that code is config, metaparticle is also strongly oriented around
the idea of [service patterns](/docs/service-patterns.md). Most of us aren't distributed
systems wizards, and even those of us who are, mostly just want to use existing patterns
rather than invent or re-implement new ones every time we want to build a service.

Thus, one of the central goals of metaparticle is to enable you to harness these patterns,
_in your code_, you define not just the implementation, but also the topology of your
distributed application in a single place.  This enables you to do all of the reasoning
about your application in a single place, and provides simplifying abstractions that make
the process of building a distributed system easier.

In the following, we'll take the first steps, we'll take that previous service and turn it
into a simple, replicated load balanced service.

```javascript
var mp = require('../metaparticle');
var os = require('os');

var numReplicas = 3;

// Create a randomly distributed service
var service = mp.service(
	"replicated-service",
	// A service that is spread amongst 3 replicas
	mp.spread(
		numReplicas,
		function serviceFunction(data) {
			return {
				"request": data,
				"server": os.hostname()
			};
		}));

service.subservices.shard.expose = true;

mp.serve();
```

Notice now, when we define our service, instead of simply providing a function to implement
our service, we are now calling `mp.spread(...)` and providing a number of replicas, in addition
to our serving function.

`spread` is a topology defining function in metaparticle, and it tells the metaparticle runtime
that we'd like to create a replicated service with a load balancer that spreads (hence the name)
load across the replicas (in this case there are three of them.)

Run this application just like before:

```console
node examples/server2.js
```

Now take a look at `docker ps`, you'll see four containers running.  Three of them are running
the replicated service, and one (the one that is port mapped to the host) is running the load
balancer.

Try hitting the service 10 times:
```console
$ for x in 0 1 2 4 5 6 7 8 9; do 
    node client.js replicated-service
  done
```

You should see something like:
```console
{"request":{"foo":"bar"},"server":"40ef7a284a34"}
{"request":{"foo":"bar"},"server":"40ef7a284a34"}
{"request":{"foo":"bar"},"server":"497ef167ed33"}
{"request":{"foo":"bar"},"server":"40ef7a284a34"}
{"request":{"foo":"bar"},"server":"f25432b6c2ee"}
{"request":{"foo":"bar"},"server":"497ef167ed33"}
{"request":{"foo":"bar"},"server":"497ef167ed33"}
{"request":{"foo":"bar"},"server":"f25432b6c2ee"}
{"request":{"foo":"bar"},"server":"f25432b6c2ee"}
```

Note the roughly even distribution of the three different backends you deployed.

Remember to tear down your service:

```console
$ node examples/server2.js delete
```

I hope by now you're beginning to see the goals and the structure of metaparticle. And you're on
your way to defining your infrastructure as code. To see a more advanced example, move on to
[chapter 3](server3.md).
