# Service Patterns
Metaparticle simplifies distributed systems by enabling users to define their
services in terms of canonical service patterns.  Metaparticle then handles
the details of transforming those services into concrete instatiations.

The currently supported service patterns are:

## Simple Service
A simple service simply exposes a function as an HTTP service.

Example:
```js
// Create a simple service.
var service = mp.service(
    "simple-service",
    // @param {Object} request is an in-bound JSON body from a POST
    // returns {Object} serialized to HTTP and sent back as the response
    function(request) {
        return {"theRequest": request};
    }
);
```

## Scatter/Gather
A Scatter/Gather service fans all requests out to all leaf nodes (*scatter* phase), all responses are then aggregated in a root node (*gather* phase), this aggregate response is returned to the caller.

Example:
```js
var service = mp.scatter(numLeafInstances, leafFunction, mergeFunction);
```

See [histogram.js](../examples/histogram.js) for a complete example.

## Shard
A Shard service runs a user specified function to select a shard (replica) for a request, the request is then
forwarded on to this specific replica, and the response from that replica is returned to the caller.

Example:
```js
var service = mp.shard(numShards, shardingFunction, leafFunction);
```

## Spread
A Spread service is similar to a Shard service (in fact they use the same underlying implementation) but the Spread
service uses a randomized `shardingFunction` so that each request is routed to a random replica and load is
uniformly spread between replicas.
```js
var service = mp.spread(numReplicas, leafFunction);
```
