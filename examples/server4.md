## Metaparticle Code Walk, Chapter 4

So far, we have seen replicated services that operate independently to service each user request.
In the following example, we'll see an example of a cooperative distributed service.

In particular, we're going to see an example of the "scatter/gather" pattern.  Scatter/gather is
used in a number of distributed systems to distribute work out to a bunch worker nodes. In a 
scatter/gather service pieces of
the work are distributed out to replicated workers (the scatter phase).  Each worker processes
independently in parallel, and then returns its result to the parent. (the gather phase).
The parent then runs a 'merge' function on the replies from all replicas to aggregate the
complete result which is then passed back as the service response.

To implement a scatter/gather service in metaparticle you use the `mp.scatter` function.

In this example, each worker is going to generate 100 random numbers from a Gaussian distribution.
These random numbers are then gathered by the parent and then turned into a histogram of the
overall distribution which is then returned back to the requestor.

Here is the complete code:

```javascript
// Import the main library
var mp = require('metaparticle');

// A simple function for calculating a Gaussian distributed value
// from a uniform random value
var gaussian = function (sigma, mean) {
    var u1 = 2 * Math.PI * Math.random();
    var u2 = -2 * Math.log(Math.random());
    var n = Math.sqrt(u2) * Math.cos(u1);
    return n * sigma + mean;
};

// This function is executed on each leaf
var leafFunction = function (data) {
    var result = { 'n': [] };
    for (var i = 0; i < 100; i++) {
        result.n.push(gaussian(25, 100));
    }
    return result;
};

// This function is executed on each root
var mergeFunction = function (responses) {
    var histogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var i = 0; i < responses.length; i++) {
        for (var j = 0; j < responses[i].n.length; j++) {
            if (responses[i].n < 0 || responses[i].n > 200) {
                continue
            }
            var ix = Math.floor(responses[i].n[j] / 20);
            histogram[ix]++;
        }
    }
    return histogram;
};

var svc = mp.service(
    // name of the service
    "histogram-service",
    // library function that creates a scatter/gather service
    mp.scatter(10, leafFunction, mergeFunction));

// Expose the root service to the world
svc.subservices.gather.expose = true;

// And serve
mp.serve();
```

You can run this service just like any other metaparticle service:

```console
$ node server4.js
```

And you can call it like any other service:

```console
$ node client.js histogram-service
[0,11,52,162,294,281,148,46,5,1]
```

When you are done, remember to tear down the service:

```console
$ node server4.js delete
```

Now you are ready to move on to storage in [chapter 5](server5.md)

