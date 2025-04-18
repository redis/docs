---
Title: rladmin cluster join
alwaysopen: false
categories:
- docs
- operate
- rs
description: Adds a node to an existing cluster.
headerRange: '[1-2]'
linkTitle: join
tags:
- non-configured
toc: 'true'
weight: $weight
---

Adds a node to an existing cluster.

```sh
rladmin cluster join
        nodes <node IP address>
        username <admin user email>
        password <admin password>
        [ ephemeral_path <path> ]
        [ persistent_path <path> ]
        [ ccs_persistent_path <path> ]
        [ rack_id <node rack ID> ]
        [ second_rack_id <node's second rack ID> ]
        [ override_rack_id ]
        [ replace_node <node UID> ]
        [ flash_enabled ]
        [ flash_path <path> ]
        [ addr <IP.address> ]
        [ external_addr <IP.address.1> [<IP.address.2> ... <IP.address.N>] ]
        [ override_repair ]
        [ accept_servers { enabled | disabled } ]
        [ cnm_http_port <port> ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| accept_servers | 'enabled'<br />'disabled' | Allows allocation of resources on the new node when enabled (optional) |
| addr | IP address | Sets a node's internal IP address. If not provided, the node sets the address automatically. (optional) |
| ccs_persistent_path | filepath (default:&nbsp;/var/opt/redislabs/persist) | Path to the CCS snapshot location (the default is the same as persistent_path) (optional) |
| cnm_http_port | integer | Joins a cluster that has a non-default cnm_http_port (optional) |
| ephemeral_path | filepath | Path to the ephemeral storage location (optional) |
| external_addr | list of IP addresses | Sets a node's external IP addresses (space-delimited list). If not provided, the node sets the address automatically. (optional) |
| flash_enabled |  | Enables flash capabilities for a database (optional) |
| flash_path | filepath (default:&nbsp;/var/opt/redislabs/flash) | Path to the flash storage location in case the node does not support CAPI (required if flash_enabled) |
| nodes | IP address | Internal IP address of an existing node in the cluster |
| override_rack_id |  | Changes to a new rack, specified by `rack_id` (optional) |
| override_repair |  | Enables joining a cluster with a dead node (optional) |
| password | string | Admin user's password |
| persistent_path | filepath (default:&nbsp;/var/opt/redislabs/persist) | Path to the persistent storage location (optional) |
| rack_id | string | Moves the node to the specified rack (optional) |
| replace_node | integer | Replaces the specified node with the new node (optional) |
| second_rack_id | string | The unique identifier of the node's second rack ID for two-dimensional rack awareness (optional) |
| username | email address | Admin user's email address |

### Returns

Returns `ok` if the node joined the cluster successfully. Otherwise, it returns an error message.

### Example

```sh
$ rladmin cluster join nodes 192.0.2.2 \
        username admin@example.com \
        password admin-password
Joining cluster... ok
```
