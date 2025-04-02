---
Title: rladmin node addr set
alwaysopen: false
categories:
- docs
- operate
- rs
description: Sets a node's internal IP address.
headerRange: '[1-2]'
linkTitle: addr
toc: 'true'
weight: $weight
url: '/operate/rs/7.4/references/cli-utilities/rladmin/node/addr/'
---

Sets the internal IP address of a node. You can only set the internal IP address when the node is down. See [Change internal IP address]({{< relref "/operate/rs/7.4/networking/multi-ip-ipv6#change-internal-ip-address" >}}) for detailed instructions.

```sh
rladmin node <ID> addr set <IP address>
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| node      | integer                        | Sets the internal IP address of the specified node                                                |
| addr   | IP address                     | Sets the node's internal IP address to the specified IP address                                      |

### Returns

Returns `Updated successfully` if the IP address was set. Otherwise, it returns an error.

Use [`rladmin status nodes`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the internal IP address was changed.

### Example

```sh
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS    EXTERNAL_ADDRESS HOSTNAME     SHARDS CORES FREE_RAM        PROVISIONAL_RAM VERSION   STATUS
*node:1 master 192.0.2.2                   3d99db1fdf4b 5/100  6     16.06GB/19.54GB 12.46GB/16.02GB 6.2.12-37 OK
node:2  slave  192.0.2.3                   fc7a3d332458 0/100  6     -/19.54GB       -/16.02GB       6.2.12-37 DOWN, last seen 33s ago
node:3  slave  192.0.2.4                   b87cc06c830f 5/120  6     16.06GB/19.54GB 12.46GB/16.02GB 6.2.12-37 OK
$ rladmin node 2 addr set 192.0.2.5
Updated successfully.
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS    EXTERNAL_ADDRESS HOSTNAME     SHARDS CORES FREE_RAM        PROVISIONAL_RAM VERSION   STATUS
*node:1 master 192.0.2.2                   3d99db1fdf4b 5/100  6     14.78GB/19.54GB 11.18GB/16.02GB 6.2.12-37 OK
node:2  slave  192.0.2.5                   fc7a3d332458 0/100  6     14.78GB/19.54GB 11.26GB/16.02GB 6.2.12-37 OK
node:3  slave  192.0.2.4                   b87cc06c830f 5/120  6     14.78GB/19.54GB 11.18GB/16.02GB 6.2.12-37 OK
```
