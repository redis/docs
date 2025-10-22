---
Title: rladmin bind
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manages the proxy policy for a specified database endpoint.
headerRange: '[1-2]'
linkTitle: bind
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/bind/'
---

Manages the proxy policy for a specific database endpoint.

## `bind endpoint exclude`

Defines a list of nodes to exclude from the proxy policy for a specific database endpoint. When you exclude a node, the endpoint cannot bind to the node's proxy.

Each time you run an exclude command, it overwrites the previous list of excluded nodes.

```sh
rladmin bind
        [ db { db:<id> | <name> } ]
        endpoint <id> exclude
        <proxy_id1 .. proxy_idN>
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| db        | db:\<id\><br /> name           | Only allows endpoints for the specified database                                               |
| endpoint  | endpoint ID                    | Changes proxy settings for the specified endpoint                              |
| proxy     | list of proxy IDs          | Proxies to exclude                                                           |

### Returns

Returns `Finished successfully` if the list of excluded proxies was successfully changed. Otherwise, it returns an error.

Use [`rladmin status endpoints`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-endpoints" >}}) to verify that the policy changed.

### Example

``` sh
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID    NAME   ID                  NODE      ROLE                      SSL
db:6     tr02   endpoint:6:1        node:2    all-nodes                 No
db:6     tr02   endpoint:6:1        node:1    all-nodes                 No
db:6     tr02   endpoint:6:1        node:3    all-nodes                 No
$ rladmin bind endpoint 6:1 exclude 2
Executing bind endpoint: OOO.
Finished successfully
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID    NAME   ID                 NODE      ROLE                       SSL
db:6     tr02   endpoint:6:1       node:1    all-nodes -2               No
db:6     tr02   endpoint:6:1       node:3    all-nodes -2               No
```

## `bind endpoint include`

Defines a list of nodes to include in the proxy policy for the specific database endpoint.

Each time you run an include command, it overwrites the previous list of included nodes.

```sh
rladmin bind
        [ db { db:<id> | <name> } ]
        endpoint <id> include
        <proxy_id1 .. proxy_idN>
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| db        | db:\<id\><br /> name           | Only allows endpoints for the specified database                                               |
| endpoint  | endpoint ID                    | Changes proxy settings for the specified endpoint                              |
| proxy     | list of proxy IDs          | Proxies to include                                                           |

### Returns

Returns `Finished successfully` if the list of included proxies was successfully changed. Otherwise, it returns an error.

Use [`rladmin status endpoints`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-endpoints" >}}) to verify that the policy changed.

### Example

``` sh
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID    NAME   ID                 NODE      ROLE                       SSL
db:6     tr02   endpoint:6:1       node:3    all-master-shards          No
$ rladmin bind endpoint 6:1 include 3
Executing bind endpoint: OOO.
Finished successfully
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID   NAME   ID                NODE      ROLE                          SSL
db:6    tr02   endpoint:6:1      node:1    all-master-shards +3          No
db:6    tr02   endpoint:6:1      node:3    all-master-shards +3          No
```

## `bind endpoint policy`

Changes the overall proxy policy for a specific database endpoint.

```sh
rladmin bind
        [ db { db:<id> | <name> } ]
        endpoint <id>
        policy { single | all-master-shards | all-nodes }
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| db        | db:\<id\><br /> name           | Only allows endpoints for the specified database                                               |
| endpoint  | endpoint ID                    | Changes proxy settings for the specified endpoint                              |
| policy    | <nobr>'all-master-shards'</nobr><br /> <nobr>'all-nodes'</nobr><br /> 'single' | Changes the [proxy policy](#proxy-policies) to the specified policy |

| Proxy&nbsp;policy<a name="proxy-policies"> | Description |
| - | - |
| all-master-shards | Multiple proxies, one on each master node (best for high traffic and multiple master shards)                     |
| all-nodes | Multiple proxies, one on each node of the cluster (increases traffic in the cluster, only used in special cases) |
| single | All traffic flows through a single proxy bound to the database endpoint (preferable in most cases)               |

### Returns

Returns `Finished successfully` if the proxy policy was successfully changed. Otherwise, it returns an error.

Use [`rladmin status endpoints`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-endpoints" >}}) to verify that the policy changed.

### Example

``` sh
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID    NAME   ID                 NODE      ROLE                       SSL
db:6     tr02   endpoint:6:1       node:1    all-nodes -2               No
db:6     tr02   endpoint:6:1       node:3    all-nodes -2               No
$ rladmin bind endpoint 6:1 policy all-master-shards
Executing bind endpoint: OOO.
Finished successfully
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID    NAME   ID                 NODE      ROLE                       SSL
db:6     tr02   endpoint:6:1       node:3    all-master-shards          No
```
