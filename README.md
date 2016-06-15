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
```

### A more complicated example
The previous example only turned up a single instance of a single service.

Metaparticle is really about (re)using distributed system patterns.

Here is a canonical scatter/gather tree.  Each request that is received
by the root, is sent out to every leaf.  All responses are aggregated on
the root, and the aggregate response is passed back to the caller.

In this particular case, each leaf simply returns 100 random numbers drawn
from a Gaussian distribution.  The root then calculates the histogram
for all of the numbers returned from all leaves and returns this histogram
to the user.  Not necessarily the most useful service, but it clearly
demonstrates the pattern.

#### Running the example
```sh
$ node examples histogram.js
```

Try running `docker ps` now, you should see 11 containers running that
implement this scatter gather topology.

To test this histogram, run
```sh
$ node client.js histogram-service
[0,6,40,155,271,312,158,47,10,1]
```

## Distributed examples
The previous examples are fun, but they don't really deploy beyond a single
machine.  To deploy true distributed systems you need to use a container
orcheastrator like [kubernetes](https://kubernetes.io).

You will also need a container registry:

```sh
$ export DOCKER_REGISTRY=${MY_CONTAINER_REGISTRY_DOT_COM}
```

Where `MY_CONTAINER_REGISTRY_DOT_COM` is a Docker registry (e.g. `gcr.io`)

Once you have that, you can run the same histogram example:

```sh
$ node examples/histogram.js
```

Then run:
```sh
$ kubectl get pods
```

To see the pods it has created.

Use `kubectl` to bridge the `gather` pod to your local machine:

```sh
$ kubectl port-forward ${pod-name}
```

In a different terminal:
```sh
$ node client.js histogram-service
```

## Why?
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

## Tell me more!
For now you are going to have to look at the examples and read the code.  More
documentation is forthcoming.
