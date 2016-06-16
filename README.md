# Metaparticle

NB: This is really a work in progress for now.

## About
Metaparticle is intended to radically simplify the process of building distributed systems.

It takes a code as config approach to defining your infrastructure.  Additionally, if you
choose to code in Javascript, you can blend your code and your infrastructure in a single file.

## Hello World

### Prerequisites
```sh
$ git clone https://github.com/brendandburns/metaparticle.git
$ npm install -g jayson q loglevel minimist tar-fs dockerode
```

If you want to run the Kubernetes examples below, then you also need
a working Kubernetes cluster and `kubectl` configured correctly.

### Running 
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
