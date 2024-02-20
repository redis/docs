---
linkTitle: APIs
title: APIs
description: Learn how to get started with Redis APIs
hideListLinks: true
         
---

Redis provides a number of APIs for developers and operators, as described in the following sections.

## APIs for Developers

### Client API

Redis comes with a wide range of commands that help you to develop real-time applications. You can find a complete overview of the Redis commands here:

- [Redis commands]({{< relref "/commands/" >}})

As a developer, you will likely use one of our supported client libraries for connecting and executing commands.

- [Connect with Redis clients introduction]({{< relfref "/docs/develop/connect/clients/" >}})

### Programmability API-s

The existing Redis commands cover most use cases, but if low latency is a critical requirement, you might need to extend Redis' server-side functionality.

The triggers and functions feature of Redis Stack and Redis Enterprise provide a solid way to run JavaScript functions inside Redis. Functions can be invoked based on triggers, which means that the client doesn't need to call for the execution of server-side business logic explicitly.

- [Triggers and functions introduction]({{< relref "/docs/develop/interact/programmability/triggers-and-functions/" >}})
- [Triggers and functions Javascript API reference]({{< relref "/docs/develop/interact/programmability/triggers-and-functions/concepts/javascript_api/" >}})

Lua scripts have been available since early versions of Redis. With Lua, the script is provided by the client and cached on the server side, which implies the risk that different clients might use a different script version.

- [Redis Lua API reference]({{< relref "/docs/develop/interact/programmability/lua-api/" >}})
- [Scripting with Lua introduction]({{< relref "/docs/develop/interact/programmability/eval-intro/" >}})

The Redis functions feature, which became available in Redis 7, supersedes the use of Lua in prior versions of Redis. The client is still responsible for invoking the execution, but unlike the previous Lua scripts, functions can now be replicated and persisted.

- [Functions and scripting in Redis 7 and beyond]({{< relref "/docs/develop/programmability/functions-intro/" >}})

If none of the previous methods fulfills your needs, then you can extend the functionality of Redis with new commands using the Redis Modules API. 

- [Redis Modules API introduction]({{< relref "/docs/develop/reference/modules/" >}})
- [Redis Modules API reference]({{< relref "/docs/develop/reference/modules/modules-api-ref/" >}})

## APIs for Operators

Redis Cloud is a fully managed Database as a Service offering and the fastest way to deploy Redis at scale. You can programmatically manage your databases, accounts, access, and credentials using the Redis Cloud REST API.

- [Redis Cloud REST API introduction]({{< relref "/docs/operator/rc/api/" >}})
- [Redis Cloud REST API examples]({{< relref "/docs/operator/rc/api/examples/" >}})
- [Redis Cloud REST API reference]({{< relref "/docs/operator/rs/references/rest-api/" >}})

If you have installed Redis Enterprise Software, you can automate operations with the Redis Enterprise REST API.

- [Redis Enterprise Software REST API introduction]({{< relref "/docs/operator/rc/api/" >}})
- [Redis Enterprise Software REST API requests]({{< relref "/docs/operator/rs/references/rest-api/requests/" >}})
- [Redis Enterprise Software REST API objects]({{< relref "/docs/operator/rs/references/rest-api/objects/" >}})

If you need to install Redis Enterprise on Kubernetes, then you can use the [Redis Enterprise for Kubernetes Operators]({{< relref "/operate/Kubernetes/" >}}). You can find the resource definitions here:

- [Redis Enterprise Cluster API](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/redis_enterprise_cluster_api.md)
- [Redis Enterprise Database API](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/redis_enterprise_database_api.md)
