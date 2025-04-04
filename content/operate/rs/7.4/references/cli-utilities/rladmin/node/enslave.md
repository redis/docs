---
Title: rladmin node enslave
alwaysopen: false
categories:
- docs
- operate
- rs
description: Changes a node's resources to replicas.
headerRange: '[1-2]'
linkTitle: enslave
toc: 'true'
weight: $weight
url: '/operate/rs/7.4/references/cli-utilities/rladmin/node/enslave/'
---

Changes the resources of a node to replicas.

## `node enslave`

Changes all of the node's endpoints and shards to replicas.

``` sh
rladmin node <ID> enslave
        [demote_node]
        [retry_timeout_seconds <seconds>]
```

### Parameters

| Parameter             | Type/Value                     | Description                                                                               |
|-----------------------|--------------------------------|-------------------------------------------------------------------------------------------|
| node                  | integer                        | Changes all of the node's endpoints and shards to replicas             |
| demote_node           |                                | If the node is a primary node, changes the node to replica                     |
| retry_timeout_seconds | integer                        | Retries on failure until the specified number of seconds has passed.                    |

### Returns

Returns `OK` if the roles were successfully changed. Otherwise, it returns an error.

Use [`rladmin status shards`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status#status-shards" >}}) to verify that the roles were changed.

### Example

```sh
$ rladmin status shards node 2
SHARDS:
DB:ID      NAME           ID               NODE         ROLE         SLOTS                  USED_MEMORY            STATUS
db:6       tr02           redis:14         node:2       master       0-4095                 3.2MB                  OK
db:6       tr02           redis:16         node:2       master       4096-8191              3.12MB                 OK
db:6       tr02           redis:18         node:2       master       8192-12287             3.16MB                 OK
db:6       tr02           redis:20         node:2       master       12288-16383            3.12MB                 OK
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS    EXTERNAL_ADDRESS  HOSTNAME     SHARDS CORES       FREE_RAM         PROVISIONAL_RAM  VERSION   STATUS
*node:1 slave  192.0.2.12 198.51.100.1      3d99db1fdf4b 1/100  6           14.43GB/19.54GB  10.87GB/16.02GB  6.2.12-37 OK
node:2  master 192.0.2.13 198.51.100.2      fc7a3d332458 4/100  6           14.43GB/19.54GB  10.88GB/16.02GB  6.2.12-37 OK
node:3  slave  192.0.2.14                   b87cc06c830f 5/120  6           14.43GB/19.54GB  10.83GB/16.02GB  6.2.12-37 OK
$ rladmin node 2 enslave demote_node
Performing enslave_node action on node:2: 100%
OK
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS    EXTERNAL_ADDRESS  HOSTNAME     SHARDS CORES       FREE_RAM         PROVISIONAL_RAM  VERSION   STATUS
*node:1 master 192.0.2.12 198.51.100.1      3d99db1fdf4b 1/100  6           14.72GB/19.54GB  10.91GB/16.02GB  6.2.12-37 OK
node:2  slave  192.0.2.13 198.51.100.2      fc7a3d332458 4/100  6           14.72GB/19.54GB  11.17GB/16.02GB  6.2.12-37 OK
node:3  slave  192.0.2.14                   b87cc06c830f 5/120  6           14.72GB/19.54GB  10.92GB/16.02GB  6.2.12-37 OK
$ rladmin status shards node 2
SHARDS:
DB:ID      NAME             ID               NODE         ROLE       SLOTS                  USED_MEMORY            STATUS
db:6       tr02             redis:14         node:2       slave      0-4095                 2.99MB                 OK
db:6       tr02             redis:16         node:2       slave      4096-8191              3.01MB                 OK
db:6       tr02             redis:18         node:2       slave      8192-12287             2.93MB                 OK
db:6       tr02             redis:20         node:2       slave      12288-16383            3.06MB                 OK
```

## `node enslave endpoints_only`

Changes the role for all endpoints on a node to replica.

``` sh
rladmin node <ID> enslave endpoints_only
        [retry_timeout_seconds <seconds>]
```

### Parameters

| Parameter             | Type/Value                     | Description                                                                               |
|-----------------------|--------------------------------|-------------------------------------------------------------------------------------------|
| node                  | integer                        | Changes all of the node's endpoints to replicas                        |
| retry_timeout_seconds | integer                        | Retries on failure until the specified number of seconds has passed.                    |

### Returns

Returns `OK` if the roles were successfully changed. Otherwise, it returns an error.

Use [`rladmin status endpoints`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status#status-endpoints" >}}) to verify that the roles were changed.

### Example

```sh
$ rladmin status endpoints
ENDPOINTS:
DB:ID         NAME        ID                             NODE            ROLE                                       SSL       
db:5          tr01        endpoint:5:1                   node:1          single                                     No        
db:6          tr02        endpoint:6:1                   node:3          all-master-shards                          No        
$ rladmin node 1 enslave endpoints_only
Performing enslave_node action on node:1: 100%
OK
$ rladmin status endpoints
ENDPOINTS:
DB:ID         NAME        ID                             NODE            ROLE                                       SSL       
db:5          tr01        endpoint:5:1                   node:3          single                                     No        
db:6          tr02        endpoint:6:1                   node:3          all-master-shards                          No       
```

## `node enslave shards_only`

Changes the role for all shards of a node to replica.

``` sh
rladmin node <ID> enslave shards_only
        [retry_timeout_seconds <seconds>]
```

### Parameters

| Parameter             | Type/Value                     | Description                                                                               |
|-----------------------|--------------------------------|-------------------------------------------------------------------------------------------|
| node                  | integer                        | Changes all of the node's shards to replicas                          |
| retry_timeout_seconds | integer                        | Retries on failure until the specified number of seconds has passed.                    |

### Returns

Returns `OK` if the roles were successfully changed. Otherwise, it returns an error.

Use [`rladmin status shards`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status#status-shards" >}}) to verify that the roles were changed.

### Example

```sh
$ rladmin status shards node 3
SHARDS:
DB:ID      NAME           ID               NODE         ROLE         SLOTS                  USED_MEMORY            STATUS     
db:5       tr01           redis:12         node:3       master       0-16383                3.04MB                 OK         
db:6       tr02           redis:15         node:3       master       0-4095                 4.13MB                 OK         
db:6       tr02           redis:17         node:3       master       4096-8191              4.13MB                 OK         
db:6       tr02           redis:19         node:3       master       8192-12287             4.13MB                 OK         
db:6       tr02           redis:21         node:3       master       12288-16383            4.13MB                 OK         
$ rladmin node 3 enslave shards_only
Performing enslave_node action on node:3: 100%
OK
$ rladmin status shards node 3
SHARDS:
DB:ID      NAME             ID               NODE         ROLE       SLOTS                  USED_MEMORY            STATUS     
db:5       tr01             redis:12         node:3       slave      0-16383                2.98MB                 OK         
db:6       tr02             redis:15         node:3       slave      0-4095                 4.23MB                 OK         
db:6       tr02             redis:17         node:3       slave      4096-8191              4.11MB                 OK         
db:6       tr02             redis:19         node:3       slave      8192-12287             4.19MB                 OK         
db:6       tr02             redis:21         node:3       slave      12288-16383            4.27MB                 OK
```
