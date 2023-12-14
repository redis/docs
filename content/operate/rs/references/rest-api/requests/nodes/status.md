---
Title: Node status requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Requests that return a node's hostname and role.
headerRange: '[1-2]'
linkTitle: status
toc: 'true'
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-nodes-status) | `/v1/nodes/status` | Get the status of all nodes |
| [GET](#get-node-status) | `/v1/nodes/{uid}/status` | Get a node's status |

## Get all node statuses {#get-all-nodes-status}

	GET /v1/nodes/status

Gets the status of all nodes. Includes each node's hostname and role in the cluster:

- Primary nodes return `"role": "master"`

- Replica nodes return `"role": "slave"`

#### Required permissions

| Permission name |
|-----------------|
| [view_node_info]({{< relref "/operate/rs/references/rest-api/permissions#view_node_info" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /nodes/status

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-all-response} 

For each node in the cluster, returns a JSON object that contains the node's hostname and role.

#### Example JSON body

```json
{
    "1": {
        "hostname": "3d99db1fdf4b",
        "role": "master"
    },
    "2": {
        "hostname": "fc7a3d332458",
        "role": "slave"
    },
    "3": {
        "hostname": "b87cc06c830f",
        "role": "slave"
    }
}
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |


## Get node status {#get-node-status}

	GET /v1/nodes/{int: uid}/status

Gets the status of a node. Includes the node's hostname and role in the cluster:

- Primary nodes return `"role": "master"`

- Replica nodes return `"role": "slave"`

#### Required permissions

| Permission name |
|-----------------|
| [view_node_info]({{< relref "/operate/rs/references/rest-api/permissions#view_node_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /nodes/1/status


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The node's unique ID. |


### Response {#get-response} 

Returns a JSON object that contains the node's hostname and role.

#### Example JSON body

```json
{
    "hostname": "3d99db1fdf4b",
    "role": "master"
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Node UID does not exist |
