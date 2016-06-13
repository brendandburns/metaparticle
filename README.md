# Metaparticle

NB: This is really a work in progress for now.

## About
Metaparticle is intended to radically simplify the process of building distributed systems.

It takes a code as config approach to defining your infrastructure.  Additionally, if you
choose to code in Javascript, you can blend your code and your infrastructure in a single file.

## Hello World

### Prerequisites
```sh
git clone https://github.com/brendandburns/metaparticle.git
npm install -g jayson q loglevel minimist tar-fs dockerode
```

### Running
```sh
cd metaparticle

# Run an example using Docker
node examples/server.js --runner=docker
node client.js simple-service
```

There are more complicated examples in the examples directory.

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
