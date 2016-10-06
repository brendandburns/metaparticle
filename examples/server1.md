## MetaParticle Code Walk, Chapter 1: A simple service

Metaparticle works by treating code as infrastructure.  This means that you
define the deployment of your application in the same place that you define
the code that implements your application.

At first, this doesn't really look much different from what you've been
doing earlier:

```javascript
// Import the metaparticle library
var mp = require('../metaparticle');

// Create a simple service.
var service = mp.service(
    "simple-service",
    // @param {Object} request is an in-bound JSON body from a POST
    // returns {Object} serialized to HTTP and sent back as the response
    function (request) {
        return { "request-was": request };
    }
);

// Expose this service on the network
service.expose = true;

// Start serving
mp.serve();
```

Metaparticle is currently JSON-RPC centric. So what you see in the above service
is a simple RPC handler which receives a request, and echos that request back
into the response.

You can run this example with:

```console
$ node examples/server1.js
building image (this may take a bit)
building image done.
deploying
$
```

The first thing that you will notice is that you have asked the service to serve,
and yet the program immediately returns. Despite this, you can hit your service
with `curl`:

```console
$ curl -X POST \
     -d '{"jsonrpc": "2.0", "params":[{"hello": "world"}], "method": "simple-service", "id": "foobar"}' \
     -H "Content-Type: application/json" \
     -s localhost:3000/
```

Metaparticle includes a simple client to make this even easier:

```console
$ node client.js simple-serve '{"hello": "world"}'
```

So what is going on here?  Remember the premise of Metaparticle is that code is config.
So when you ran your program, you actually built and deployed an instance of your
application. Try running `docker ps` and you should see your running container.

If you want to tear down your application, you can run:

```console
$ node examples/server1.js delete
```

Run `docker ps` again and you'll see your application is gone.

Try editing the `server1.js`, and re-deploy.  You'll see your changes.

And yes, clearly `update` would be a handy command.  Metaparticle is a work in progress ;)

Remember to tear down your server:

```console
$ node examples/server1.js delete
```

Ok, ready to move on?  Let's go to [chapter 2](server2.md).