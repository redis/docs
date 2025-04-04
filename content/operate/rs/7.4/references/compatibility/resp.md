---
Title: RESP compatibility with Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- rs
description: Redis Enterprise supports RESP2 and RESP3.
linkTitle: RESP
toc: 'true'
weight: 80
url: '/operate/rs/7.4/references/compatibility/resp/'
---

RESP (Redis Serialization Protocol) is the protocol that clients use to communicate with Redis databases. See the [RESP protocol specification]({{< relref "/develop/reference/protocol-spec" >}}) for more information.

## Supported RESP versions

- RESP2 is supported by all Redis Enterprise versions.

- RESP3 is supported by Redis Enterprise 7.2 and later.

{{<note>}}
Redis Enterprise versions that support RESP3 continue to support RESP2.
{{</note>}}


## Enable RESP3 for a database {#enable-resp3}

To use RESP3 with a Redis Enterprise Software database:

1. Upgrade Redis servers to version 7.2 or later.

    For Active-Active and Replica Of databases:
 
    1. Upgrade all participating clusters to Redis Enterprise version 7.2.x or later.
 
    1. Upgrade all databases to version 7.x or later.

1. Enable RESP3 support for your database (`enabled` by default):

    - [`rladmin tune db`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/tune#tune-db" >}}):

        ```sh
        rladmin tune db db:<ID> resp3 enabled
        ```

        You can use the database name in place of `db:<ID>` in the preceding command.

    - [Update database configuration]({{< relref "/operate/rs/7.4/references/rest-api/requests/bdbs#put-bdbs" >}}) REST API request:

        ```sh
        PUT /v1/bdbs/<uid> 
        { "resp3": true }
        ```

 ## Deactivate RESP3 for a database {#deactivate-resp3}

 To deactivate RESP3 support for a database:

- [`rladmin tune db`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/tune#tune-db" >}}):

     ```sh
    rladmin tune db db:<ID> resp3 disabled
    ```

    You can use the database name in place of `db:<ID>` in the preceding command.

- [Update database configuration]({{< relref "/operate/rs/7.4/references/rest-api/requests/bdbs#put-bdbs" >}}) REST API request:

    ```sh
    PUT /v1/bdbs/<uid> 
    { "resp3": false }
    ```

 When RESP3 is deactivated, connected clients that use RESP3 are disconnected from the database.

{{<note>}}
You cannot use sharded pub/sub if you deactivate RESP3 support.
{{</note>}}

## Change default RESP3 option

The cluster-wide option `resp3_default` determines the default value of the `resp3` option, which enables or deactivates RESP3 for a database, upon upgrading a database to version 7.2. `resp3_default` is set to `enabled` by default.

To change `resp3_default` to `disabled`, use one of the following methods:

- Cluster Manager UI:

    1. On the **Databases** screen, select {{< image filename="/images/rs/buttons/button-toggle-actions-vertical.png#no-click" alt="Toggle actions button" width="22px" class="inline" >}} to open a list of additional actions.

    1. Select **Upgrade configuration**.

    1. For **RESP3 support**, select **Disable**.

    1. Click **Save**.

- [`rladmin tune cluster`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/tune#tune-cluster" >}})

    ```sh
    rladmin tune cluster resp3_default disabled
    ```

- [Update cluster policy]({{< relref "/operate/rs/7.4/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "resp3_default": false }
    ```

## Client prerequisites for Redis 7.2 upgrade

The Redis clients [Go-Redis](https://redis.uptrace.dev/) version 9 and [Lettuce](https://redis.github.io/lettuce/) versions 6 and later use RESP3 by default. If you use either client to run Redis Stack commands, you should set the client's protocol version to RESP2 before upgrading your database to Redis version 7.2 to prevent potential application issues due to RESP3 breaking changes.

### Go-Redis

For applications using Go-Redis v9.0.5 or later, set the protocol version to RESP2:

```go
client := redis.NewClient(&redis.Options{
    Addr:     "<database_endpoint>",
    Protocol: 2, // Pin the protocol version
})
```

### Lettuce

To set the protocol version to RESP2 with Lettuce v6 or later:

```java
import io.lettuce.core.*;
import io.lettuce.core.api.*;
import io.lettuce.core.protocol.ProtocolVersion;

// ...
RedisClient client = RedisClient.create("<database_endpoint>");
client.setOptions(ClientOptions.builder()
        .protocolVersion(ProtocolVersion.RESP2) // Pin the protocol version 	
        .build());
// ...
```

If you are using [LettuceMod](https://github.com/redis-developer/lettucemod/), you need to upgrade to [v3.6.0](https://github.com/redis-developer/lettucemod/releases/tag/v3.6.0).
