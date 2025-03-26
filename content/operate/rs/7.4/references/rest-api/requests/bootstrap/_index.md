---
Title: Bootstrap requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Bootstrap requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: bootstrap
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/bootstrap/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-bootstrap) | `/v1/boostrap` | Get the local node's bootstrap status |
| [POST](#post-bootstrap) | `/v1/bootstrap/{action}` | Initiate bootstrapping |

## Get bootstrap status {#get-bootstrap}

```sh
GET /v1/bootstrap
```

Get the local node's bootstrap status.

This request is accepted as soon the cluster software is installed and before the node is part of an active cluster.

Once the node is part of an active cluster, authentication is required.

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bootstrap
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Accept | application/json | Accepted media type |

### Response {#get-response}

The JSON response object contains a `bootstrap_status` object and a `local_node_info` object.

The `bootstrap_status` object contains the following information:

| Field | Description |
|-------|-------------|
| state | Current bootstrap state.<br></br>`idle`: No bootstrapping started.<br></br>`initiated`: Bootstrap request received.<br></br>`creating_cluster`: In the process of creating a new cluster.<br></br>`recovering_cluster`: In the process of recovering a cluster.<br /><br />`joining_cluster`: In the process of joining an existing cluster.<br></br>`error`: The last bootstrap action failed.<br></br>`completed`: The last bootstrap action completed successfully.|
| start_time | Bootstrap process start time |
| end_time | Bootstrap process end time |
| error_code | If state is `error`, this error code describes the type of error encountered. |
| error_details | An error-specific object that may contain additional information about the error. A common field in use is `message` which provides a more verbose error message.

The `local_node_info` object is a subset of a [node object]({{< relref "/operate/rs/references/rest-api/objects/node" >}}) that provides information about the node configuration.

#### Example JSON body

```json
{
    "bootstrap_status": {
        "start_time": "2014-08-29T11:19:49Z",
        "end_time": "2014-08-29T11:19:49Z",
        "state": "completed"
    },
    "local_node_info": {
        "uid": 3,
        "software_version": "0.90.0-1",
        "cores": 2,
        "ephemeral_storage_path": "/var/opt/redislabs/tmp",
        "ephemeral_storage_size": 1018889.8304,
        "os_version": "Ubuntu 14.04 LTS",
        "persistent_storage_path": "/var/opt/redislabs/persist/redis",
        "persistent_storage_size": 1018889.8304,
        "total_memory": 24137,
        "uptime": 50278,
        "available_addrs": [{
                                 "address": "172.16.50.122",
                                 "format": "ipv4",
                                 "if_name": "eth0",
                                 "private": true
                             },
                             {
                                 "address": "10.0.3.1",
                                 "format": "ipv4",
                                 "if_name": "lxcbr0",
                                 "private": true
                             },
                             {
                                 "address": "172.17.0.1",
                                 "format": "ipv4",
                                 "if_name": "docker0",
                                 "private": true
                             },
                            {
                                 "address": "2001:db8:0:f101::1",
                                 "format": "ipv6",
                                 "if_name": "eth0",
                                 "private": false
                            }]
    }
}
```

### Error codes {#get-error-codes}

| Code | Description |
|------|-------------|
| config_error | An error related to the bootstrap configuration provided (e.g. bad JSON). |
| connect_error | Failed to connect to cluster (e.g. FQDN DNS could not resolve, no/wrong node IP provided, etc. |
| access_denied | Invalid credentials supplied. |
| invalid_license | The license string provided is invalid. Additional info can be fetched from the `error_details` object, which includes the violation code in case the license is valid but its terms are violated. |
| repair_required | Cluster is in degraded mode and can only accept replacement nodes. When this happens, `error_details` contains two fields: `failed_nodes` and `replace_candidate`. The `failed_nodes` field is an array of objects, each describing a failed node with at least a `uid` field and an optional `rack_id`. `replace_candidate` is the UID of the node most suitable for replacement. |
| insufficient_node_memory | An attempt to replace a dead node fails because the replaced node does not have enough memory. When this happens, error_details contains a required_memory field which indicates the node memory requirement. |
| insufficient_node_flash | An attempt to replace a dead node fails because the replaced node does not have enough flash. When this happens, `error_details` contains a `required_flash` field which indicates the node flash requirement. |
| time_not_sync | An attempt to join a node with system time not synchronized with the rest of the cluster. |
| rack_id_required | An attempt to join a node with no `rack_id` in a rack-aware cluster. In addition, a `current_rack_ids` field will include an array of currently used rack ids. |
| socket_directory_mismatch | An attempt to join a node with a socket directory setting that differs from the cluster |
| node_config_mismatch | An attempt to join a node with a configuration setting (e.g. confdir, osuser, installdir) that differs from the cluster |
| path_error | A needed path does not exist or is not accessable. |        
| internal_error | A different, unspecified internal error was encountered. |

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

## Start bootstrapping {#post-bootstrap}

```sh
POST /v1/bootstrap/{action}
```

Initiate bootstrapping.

The request must contain a bootstrap configuration JSON object, as
described in [Object attributes]({{< relref "/operate/rs/references/rest-api/objects/" >}}) or a minimal subset.

Bootstrapping is permitted only when the current bootstrap state is
`idle` or `error` (in which case the process will restart with the new
configuration).

This request is asynchronous - once the request has been accepted,
the caller is expected to poll bootstrap status while waiting for it to
complete.

### Request {#post-request}

#### Example HTTP request

```sh
POST /v1/bootstrap/create_cluster
```

#### Example JSON body

##### Join cluster
```json
{
    "action": "join_cluster",
    "cluster": {
       "nodes":[ "1.1.1.1", "2.2.2.2" ]
    },
    "node": {
       "paths": {
          "persistent_path": "/path/to/persistent/storage",
          "ephemeral_path": "/path/to/ephemeral/storage",
          "bigstore_path": "/path/to/bigstore/storage"
       },
       "bigstore_driver": "speedb",
       "identity": {
          "addr":"1.2.3.4",
          "external_addr":["2001:0db8:85a3:0000:0000:8a2e:0370:7334", "3.4.5.6"]
       }
    },
    "credentials": {
       "username": "my_username",
       "password": "my_password"
    }
}
```

##### Create cluster
```json
{
    "action": "create_cluster",
    "cluster": {
       "nodes": [],
       "name": "my.cluster"
    },
    "node": {
       "paths": {
          "persistent_path": "/path/to/persistent/storage",
          "ephemeral_path": "/path/to/ephemeral/storage",
          "bigstore_path": "/path/to/bigredis/storage"
       },
       "identity": {
          "addr":"1.2.3.4",
          "external_addr":["2001:0db8:85a3:0000:0000:8a2e:0370:7334", "3.4.5.6"]
       },
       "bigstore_driver": "rocksdb"
    },
    "license": "----- LICENSE START -----\ndi+iK...KniI9\n----- LICENSE END -----\n",
    "credentials": {
       "username": "my_username",
       "password": "my_password"
    }
}
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include a [bootstrap object]({{< relref "/operate/rs/references/rest-api/objects/bootstrap" >}}) in the request body.

### Response {#post-response}

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Request received and processing begins. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Bootstrap already in progress (check state) |
