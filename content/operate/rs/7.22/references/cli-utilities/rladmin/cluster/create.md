---
Title: rladmin cluster create
alwaysopen: false
categories:
- docs
- operate
- rs
description: Creates a new cluster.
headerRange: '[1-2]'
linkTitle: create
tags:
- non-configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/cluster/create/'
---

Creates a new cluster. The node where you run `rladmin cluster create` becomes the first node of the new cluster.

```sh
cluster create
        name <cluster name>
        username <admin email>
        password <admin password>
        [ node_uid <node UID> ] 
        [ rack_aware ]
        [ rack_id <node rack ID> ]
        [ second_rack_id <node's second rack ID> ]
        [ license_file <file> ]
        [ ephemeral_path <path> ]
        [ persistent_path <path> ]
        [ ccs_persistent_path <path> ]
        [ register_dns_suffix ]
        [ flash_enabled ]
        [ flash_path <path> ]
        [ addr <IP.address> ]
        [ external_addr <IP.address.1> [<IP.address.2> ... <IP.address.N>] ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| addr | IP address | The node's internal IP address (optional) |
| ccs_persistent_path | filepath (default:&nbsp;/var/opt/redislabs/persist) | Path to the location of CCS snapshots (optional) |
| ephemeral_path | filepath (default:&nbsp;/var/opt/redislabs) | Path to the ephemeral storage location (optional) |
| external_addr | list of IP addresses | A space-delimited list of the node's external IP addresses (optional) |
| flash_enabled | | Enables flash storage (optional) |
| flash_path | filepath (default:&nbsp;/var/opt/redislabs/flash) | Path to the flash storage location (optional) |
| license_file | filepath | Path to the RLEC license file (optional) |
| name | string | Cluster name |
| node_uid | integer | Unique node ID (optional) |
| password | string | Admin user's password |
| persistent_path | filepath (default:&nbsp;/var/opt/redislabs/persist) | Path to the persistent storage location (optional) |
| rack_aware | | Activates or deactivates rack awareness (optional) |
| rack_id | string | The rack's unique identifier (optional) |
| register_dns_suffix | | Enables database mapping to both internal and external IP addresses (optional) |
| second_rack_id | string | The unique identifier of the node's second rack ID for two-dimensional rack awareness (optional) |
| username | email address | Admin user's email address |

### Returns

Returns `ok` if the new cluster was created successfully. Otherwise, it returns an error message.

### Example

```sh
$ rladmin cluster create name cluster.local \
        username admin@example.com \
        password admin-password
Creating a new cluster... ok
```
