---
Title: Node snapshot requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Node snapshot requests
headerRange: '[1-2]'
linkTitle: snapshots
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/nodes/snapshots/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-snapshots) | `/v1/nodes/{uid}/snapshots` | Get node snapshots |
| [DELETE](#delete-snapshot) | `/v1/nodes/{uid}/snapshots/{snapshot_name}` | Delete a node snapshot |

## Get node snapshots {#get-snapshots}

```sh
GET /v1/nodes/{int: uid}/snapshots
```

Get all cluster node snapshots of the specified node.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_node_info]({{< relref "/operate/rs/7.4/references/rest-api/permissions#view_node_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/nodes/1/snapshots
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the node requested. |

### Response {#get-response}

Returns an array of node snapshot JSON objects.

#### Example JSON body

```json
[
    {
        "created_time": "2024-01-10 20:55:54",
        "name": "nightly_snapshot_1",
        "node_uid": "1"
    },
    {
        "created_time": "2024-01-11 20:55:54",
        "name": "nightly_snapshot_2",
        "node_uid": "1"
    }
]
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Node UID does not exist |

## Delete node snapshot {#delete-snapshot}

```sh
DELETE /v1/nodes/{int: uid}/snapshots/{snapshot_name}
```

Delete a cluster node snapshot. Snapshots created by maintenance mode are not deleted.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_node]({{< relref "/operate/rs/7.4/references/rest-api/permissions#update_node" >}}) | admin |

### Request {#delete-request}

#### Example HTTP request

```sh
DELETE /v1/nodes/1/snapshots/nightly_snapshot_19
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the updated node. |
| snapshot_name | string | The unique name of the snapshot to delete. |

### Response {#delete-response}

Returns a JSON object that represents the deleted node snapshot.

#### Example JSON body

```json
{
    "created_time": "2024-01-11 20:55:54",
    "name": "nightly_snapshot_19",
    "node_uid": "1"
}
```

#### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [403 Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | Node snapshot is a maintenance snapshot and cannot be deleted |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Node uid does not exist |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Snapshot name does not exist for this node uid |
