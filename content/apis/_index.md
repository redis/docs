---
description: An overview of Redis APIs for developers and operators
hideListLinks: true
linkTitle: APIs
title: APIs
type: develop
---

Redis provides a number of APIs for developers and operators. The following sections provide you easy access to the client API, the several programmability APIs, the RESTFul management APIs and the Kubernetes resource definitions.

## APIs for Developers

### Client API

Redis comes with a wide range of commands that help you to develop real-time applications. You can find a complete overview of the Redis commands here:

- [Redis commands]({{< relref "/commands/" >}})

As a developer, you will likely use one of our supported client libraries for connecting and executing commands.

- [Connect with Redis clients introduction]({{< relref "/develop/clients" >}})

### Programmability APIs

The existing Redis commands cover most use cases, but if low latency is a critical requirement, you might need to extend Redis' server-side functionality.

Lua scripts have been available since early versions of Redis. With Lua, the script is provided by the client and cached on the server side, which implies the risk that different clients might use a different script version.

- [Redis Lua API reference]({{< relref "/develop/programmability/lua-api" >}})
- [Scripting with Lua introduction]({{< relref "/develop/programmability/eval-intro" >}})

The Redis functions feature, which became available in Redis 7, supersedes the use of Lua in prior versions of Redis. The client is still responsible for invoking the execution, but unlike the previous Lua scripts, functions can now be replicated and persisted.

- [Functions and scripting in Redis 7 and beyond]({{< relref "/develop/programmability/functions-intro" >}})

If none of the previous methods fulfills your needs, then you can extend the functionality of Redis with new commands using the Redis Modules API. 

- [Redis Modules API introduction]({{< relref "/develop/reference/modules/" >}})
- [Redis Modules API reference]({{< relref "/develop/reference/modules/modules-api-ref" >}})

## APIs for Operators

### Redis Cloud API
Redis Cloud is a fully managed Database as a Service offering and the fastest way to deploy Redis at scale. You can programmatically manage your databases, accounts, access, and credentials using the Redis Cloud REST API.

- [Redis Cloud REST API introduction]({{< relref "/operate/rc/api/" >}})
- [Redis Cloud REST API examples]({{< relref "/operate/rc/api/examples/" >}})
- [Redis Cloud REST API reference]({{< relref "/operate/rc/api/api-reference" >}})


### Redis Enterprise Software API
If you have installed Redis Enterprise Software, you can automate operations with the Redis Enterprise REST API.

- [Redis Enterprise Software REST API introduction]({{< relref "/operate/rs/references/rest-api/" >}})
- [Redis Enterprise Software REST API requests]({{< relref "/operate/rs/references/rest-api/requests/" >}})
- [Redis Enterprise Software REST API objects]({{< relref "/operate/rs/references/rest-api/objects/" >}})


### Redis Enterprise for Kubernetes API

If you need to install Redis Enterprise on Kubernetes, then you can use the [Redis Enterprise for Kubernetes Operators]({{< relref "/operate/Kubernetes/" >}}). You can find the resource definitions here:

- [Redis Enterprise Cluster API]({{<relref "/operate/kubernetes/reference/redis_enterprise_cluster_api">}})
- [Redis Enterprise Database API]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api">}})
