# Metaparticle on Kubernetes

The previous examples are fun, but they don't really deploy beyond a single
machine.  To deploy true distributed systems you need to use a container
orcheastrator like [kubernetes](https://kubernetes.io).

## Prerequisites
To run the Kubernetes examples below, you need
a working Kubernetes cluster and `kubectl` configured correctly.

Try running:
```sh
kubectl get nodes
```

If that returns one or more nodes, you're ready to go.  If you are new to
running a Kubernetes cluster, please see 
[minikube](https://github.com/kubernetes/minikube) for an easy way to get
started.

You will also need a container registry:

```sh
$ export DOCKER_REGISTRY=${MY_CONTAINER_REGISTRY_DOT_COM}
```

Where `MY_CONTAINER_REGISTRY_DOT_COM` is a Docker registry (e.g. `gcr.io`),
you will also want to set an image name prefix:

```sh
$ export DOCKER_IMAGE_PREFX=${MY_IMAGE_PREFIX}
```

Images will be pused to 
`${DOCKER_REGISTRY}/${MY_IMAGE_PREFIX}/${service-name}`

Once you have that, you can run the same histogram example:

```sh
$ node examples/histogram.js --runner=kubernetes
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

To tear things down:
```sh
$ node examples/histogram.js --runner=kubernetes delete
```

