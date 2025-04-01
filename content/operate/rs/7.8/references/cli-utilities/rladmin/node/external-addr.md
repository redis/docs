---
Title: rladmin node external_addr
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configures a node's external IP addresses.
headerRange: '[1-2]'
linkTitle: external_addr
toc: 'true'
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/rladmin/node/external-addr/'
---

Configures a node's external IP addresses.

## `node external_addr add`

Adds an external IP address that accepts inbound user connections for the node.

```sh
rladmin node <ID> external_addr
        add <IP address>
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| node      | integer                        | Adds an external IP address for the specified node                                               |
| IP address | IP address                     | External IP address of the node                                                               |

### Returns

Returns `Updated successfully` if the IP address was added. Otherwise, it returns an error.

Use [`rladmin status nodes`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the external IP address was added.

### Example

``` sh
$ rladmin node 1 external_addr add 198.51.100.1
Updated successfully.
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS   EXTERNAL_ADDRESS  HOSTNAME     SHARDS CORES       FREE_RAM         PROVISIONAL_RAM  VERSION   STATUS
*node:1 master 192.0.2.2 198.51.100.1      3d99db1fdf4b 5/100  6           14.75GB/19.54GB  11.15GB/16.02GB  6.2.12-37 OK
node:2  slave  192.0.2.3                   fc7a3d332458 0/100  6           14.75GB/19.54GB  11.24GB/16.02GB  6.2.12-37 OK
node:3  slave  192.0.2.4                   b87cc06c830f 5/120  6           14.75GB/19.54GB  11.15GB/16.02GB  6.2.12-37 OK
```

## `node external_addr set`

Sets one or more external IP addresses that accepts inbound user connections for the node.

```sh
rladmin node <ID> external_addr
        set <IP address 1> ... <IP address N>
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| node      | integer                        | Sets external IP addresses for the specified node                                             |
| IP address | list of IP addresses           | Sets specified IP addresses as external addresses                                                 |

### Returns

Returns `Updated successfully` if the IP addresses were set. Otherwise, it returns an error.

Use [`rladmin status nodes`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the external IP address was set.

### Example

``` sh
$ rladmin node 2 external_addr set 198.51.100.2 198.51.100.3
Updated successfully.
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS   EXTERNAL_ADDRESS          HOSTNAME     SHARDS CORES FREE_RAM        PROVISIONAL_RAM VERSION   STATUS
*node:1 master 192.0.2.2 198.51.100.1              3d99db1fdf4b 5/100  6     14.75GB/19.54GB 11.15GB/16.02GB 6.2.12-37 OK
node:2  slave  192.0.2.3 198.51.100.2,198.51.100.3 fc7a3d332458 0/100  6     14.75GB/19.54GB 11.23GB/16.02GB 6.2.12-37 OK
node:3  slave  192.0.2.4                           b87cc06c830f 5/120  6     14.75GB/19.54GB 11.15GB/16.02GB 6.2.12-37 OK
```
## `node external_addr remove`

Removes the specified external IP address from the node.

```sh
rladmin node <ID> external_addr
        remove <IP address>
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| node      | integer                        | Removes an external IP address for the specified node                                            |
| IP address | IP address                     | Removes the specified IP address of the node                                                      |

### Returns

Returns `Updated successfully` if the IP address was removed. Otherwise, it returns an error.

Use [`rladmin status nodes`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the external IP address was removed.

### Example

``` sh
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS   EXTERNAL_ADDRESS          HOSTNAME     SHARDS CORES FREE_RAM        PROVISIONAL_RAM VERSION   STATUS
*node:1 master 192.0.2.2 198.51.100.1              3d99db1fdf4b 5/100  6     14.75GB/19.54GB 11.15GB/16.02GB 6.2.12-37 OK
node:2  slave  192.0.2.3 198.51.100.2,198.51.100.3 fc7a3d332458 0/100  6     14.75GB/19.54GB 11.23GB/16.02GB 6.2.12-37 OK
node:3  slave  192.0.2.4                           b87cc06c830f 5/120  6     14.75GB/19.54GB 11.15GB/16.02GB 6.2.12-37 OK
$ rladmin node 2 external_addr remove 198.51.100.3
Updated successfully.
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS   EXTERNAL_ADDRESS  HOSTNAME     SHARDS CORES       FREE_RAM         PROVISIONAL_RAM  VERSION   STATUS
*node:1 master 192.0.2.2 198.51.100.1      3d99db1fdf4b 5/100  6           14.74GB/19.54GB  11.14GB/16.02GB  6.2.12-37 OK    
node:2  slave  192.0.2.3 198.51.100.2      fc7a3d332458 0/100  6           14.74GB/19.54GB  11.22GB/16.02GB  6.2.12-37 OK    
node:3  slave  192.0.2.4                   b87cc06c830f 5/120  6           14.74GB/19.54GB  11.14GB/16.02GB  6.2.12-37 OK    
```
