## Open Questions

Metaparticle is currently more of a proof of concept than a fully functional system.

There are a large number of questions that need to be sorted out before it truly can
be considered ready for primetime. These include:


What about non-Node applications?  We should be able to just specify any arbitrary Docker
container and have it still work.

What about non JSON-RPC applications, in particular, what about RESTful applications?

How do I include local files into my metaparticle application.

How do we break apart Metaparticle into a language specific "compiler" and a middle "object code"
representation that can be deployed to an underlying runtime. 