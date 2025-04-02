---
Title: Develop with Redis clients
alwaysopen: false
categories:
- docs
- operate
- rs
description: Redis client libraries allow you to connect to Redis instances from within
  your application. This section provides an overview of several recommended Redis
  clients for popular programming and scripting languages.
hideListLinks: true
linkTitle: Redis clients
weight: 80
url: '/operate/rs/7.8/references/client_references/'
---
To connect to Redis instances from within your application, use a Redis client library that matches your application's language.

## Official clients

| Language | Client name |
| :---------- | :------------- |
| .Net | [NRedisStack]({{< relref "/develop/clients/dotnet" >}}) |
| Go | [go-redis]({{< relref "/develop/clients/go" >}}) |
| Java | [Jedis]({{< relref "/develop/clients/jedis" >}}) (Synchronous) and [Lettuce]({{< relref "/develop/clients/lettuce" >}}) (Asynchronous) |
| Node.js | [node-redis]({{< relref "/develop/clients/nodejs" >}}) |
| Python | [redis-py]({{< relref "/develop/clients/redis-py" >}}) |

Select a client name to see its quick start.

## Other clients

For a list of community-driven Redis clients, which are available for more programming languages, see
[Community-supported clients]({{< relref "/develop/clients#community-supported-clients" >}}).
