# Metaparticle

NB: This is really a work in progress for now.

## About
Metaparticle is intended to radically simplify the process of building distributed systems.  Metaparticle
intends to remove much of the boilerplate associated with implementing and deploying common
distributed system patterns.  Metaparticle enables you to focus on your code, while allowing you to treat
your architecture as code as well.

Metaparticle does this using a *code as config* approach to defining your infrastructure.  This approach is
intended to work with containerized applications regardless of the language in which those applications
are written.  Additionally, if you
choose to code in Javascript, you can blend your code and your infrastructure in a single file.

Metaparticle works by defining [service patterns](docs/service-patterns.md), which you can instantiate
via simple code.  This code contains both the definition of your architecture as well as the
implementation of the service itself.

Currently Metaparticle supports the following *service patterns*:
   * Scatter/Gather  (aka Fan-Out/Fan-In)
   * Shard: Choose a replica based on a user-supplied sharding function
   * Spread: Spread load uniformly across all replicas

Without further ado, here are some examples:

## Hello World

### Prerequisites
```sh
$ git clone https://github.com/brendandburns/metaparticle.git
$ npm install -g jayson q loglevel minimist tar-fs dockerode
```

If you want to run the Kubernetes examples below, then you also need
a working Kubernetes cluster and `kubectl` configured correctly.

### Running 
This will run a simple HTTP service.  This service simply executes
the following javascript function:

```js
function(request) {
    return {"A": request};
}
```

The result is returned over HTTP as a JSON blob.  The complete
service is defined [here](examples/server.js).

Here's how to run this service.

```sh
$ cd metaparticle

# Run an example using Docker
$ node examples/server.js --runner=docker

# Connect to the service you just ran
$ node client.js simple-service
{"A":{"foo":"bar"}}

# Tear down your service
$ node examples/server.js --runner=docker delete
```

You can look at [client.js](client.js) for the details of
the client/server interactions.

## A more complex service 
The previous example only turned up a single instance of a single service.

Metaparticle is really about (re)using distributed system patterns.

[Here](docs/histogram.md) is an example of a scatter/gather tree. 
Each request that is received
by the root, is sent out to every leaf.  All responses are aggregated on
the root, and the aggregate response is passed back to the caller.

## Distributed examples
The previous examples are fun, but they don't really deploy beyond a single
machine.  [Here](docs/distributed.md) are instructions for using metaparticle
to deploy to Kubernetes.

## FAQ

### Why?
Configuration and deployment has long been a central challenge of distributed system
design and operations.  Repeatedly people have taken the approach of defining domain
specific languages (DSLs) and gradually transforming them into programming languages
that are incomplete, hard to test, hard to read, lacking in idioms and proper tooling
and many, many failings that make them challenging and brittle to use.

Instead, we take a *code as config* approach where we use a proper, fully functional
idiomatic programming language as the basis for expressing the configuration of the
system.  Consequently, we can bring to bear the full set of tools available in that
language, including: unit tests, code review, style guides, standard libraries and
more.  Imagine writing unit tests for your infrastructure!

### Where are you going?
Plans include drinking more coffee.  Also possibly writing more code.

In the off chance that I do write more code, it will likely be about the
following things:

   * Incorporating services implemented in something other than node.js
   * Figuring out something about storage.

### Can I help?
Absolutely!  File issues, send PRs.

### Can you tell me more about...?
For now you are going to have to look at the examples and read the code.  More
documentation is forthcoming.
