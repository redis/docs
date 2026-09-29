---
Title: Granular metrics requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Granular metrics collection requests
headerRange: '[1-2]'
linkTitle: granular
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-granular-status) | `/v1/metrics/granular/status` | Get the granular metrics collection status of cluster nodes |
| [POST](#post-granular-start) | `/v1/metrics/granular/start` | Start granular metrics collection |
| [POST](#post-granular-stop) | `/v1/metrics/granular/stop` | Stop granular metrics collection |
| [DELETE](#delete-granular-data) | `/v1/metrics/granular/data` | Delete granular metrics data |

These requests manage the granular tier of [local metrics storage]({{< relref "/operate/rs/monitoring/metrics_stream_engine/local-metrics-storage#tiers" >}}). None of them take a request body.

## Get granular metrics status {#get-granular-status}

	GET /v1/metrics/granular/status

Get the granular metrics collection status of all nodes or of a specific node.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request}

#### Example HTTP request

	GET /v1/metrics/granular/status

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| node_uid | integer | Optional. The ID of the node to get the status of. If omitted, returns the status of all nodes. |

### Response {#get-response}

Returns a `nodes` array with one object for each node in scope.

#### Example JSON body

```json
{
  "nodes": [
    { "uid": "1", "state": "running", "started_at": 1771770600, "expires_in_sec": 2820 },
    { "uid": "2", "state": "stopped", "stopped_at": 1771770600, "auto_cleanup_in_sec": 82800, "disk_usage_bytes": 131072000 }
  ]
}
```

#### Node status fields

Timestamps are Unix epoch seconds.

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The node ID |
| state | string | Granular collection state on the node:<br />`running`<br />`stopped` |
| started_at | integer | When collection started. Included only while `state` is `running`. |
| expires_in_sec | integer | Seconds until collection stops automatically. Included only while `state` is `running`. |
| stopped_at | integer | When collection stopped. Included only after collection stops, while granular data is still on disk. |
| auto_cleanup_in_sec | integer | Seconds until the granular data is deleted automatically. Included only after collection stops, while granular data is still on disk. |
| disk_usage_bytes | integer | Disk space used by granular data, in bytes |

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | The `node_uid` doesn't match a node in the cluster (`error_code`: `node_not_found`). |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Internal server error. |

## Start granular metrics collection {#post-granular-start}

	POST /v1/metrics/granular/start

Start granular metrics collection on all nodes or on a specific node. Collection stops automatically after the maximum duration set in [`granular_metrics_job_settings`]({{< relref "/operate/rs/references/rest-api/objects/job_scheduler/granular_metrics_job_settings" >}}).

The request is idempotent. Starting collection on a node where it's already running returns `already_running`.

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#post-start-request}

#### Example HTTP request

	POST /v1/metrics/granular/start

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| node_uid | integer | Optional. The ID of the node to start collection on. If omitted, starts collection on all nodes. |

### Response {#post-start-response}

Returns a `results` array with one object for each node in scope.

#### Example JSON body

```json
{
  "results": [
    { "uid": "1", "outcome": "started", "started_at": 1771770600, "expires_at": 1771774200 },
    { "uid": "2", "outcome": "already_running", "started_at": 1771769000, "expires_at": 1771772600 },
    { "uid": "3", "outcome": "unknown" }
  ]
}
```

#### Result fields

Timestamps are Unix epoch seconds.

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The node ID |
| outcome | string | Result on the node:<br />`started`: collection started.<br />`already_running`: collection was already running.<br />`unknown`: the result couldn't be confirmed. [Get the granular status](#get-granular-status) of the node to check. |
| started_at | integer | When collection started |
| expires_at | integer | When collection stops automatically |

### Status codes {#post-start-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | The `node_uid` doesn't match a node in the cluster (`error_code`: `node_not_found`). |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Internal server error. |

## Stop granular metrics collection {#post-granular-stop}

	POST /v1/metrics/granular/stop

Stop granular metrics collection on all nodes or on a specific node. The collected data stays on disk until it's [deleted](#delete-granular-data) or the cleanup delay set in [`granular_metrics_job_settings`]({{< relref "/operate/rs/references/rest-api/objects/job_scheduler/granular_metrics_job_settings" >}}) passes.

The request is idempotent. Stopping collection on a node where it isn't running returns `already_stopped`.

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#post-stop-request}

#### Example HTTP request

	POST /v1/metrics/granular/stop

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| node_uid | integer | Optional. The ID of the node to stop collection on. If omitted, stops collection on all nodes. |

### Response {#post-stop-response}

Returns a `results` array with one object for each node in scope.

#### Example JSON body

```json
{
  "results": [
    { "uid": "1", "outcome": "stopped", "stopped_at": 1771774200, "ran_for_sec": 3600 },
    { "uid": "2", "outcome": "already_stopped" }
  ]
}
```

#### Result fields

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The node ID |
| outcome | string | Result on the node:<br />`stopped`: collection stopped.<br />`already_stopped`: collection wasn't running. |
| stopped_at | integer | When collection stopped, in Unix epoch seconds |
| ran_for_sec | integer | How long collection ran, in seconds |

### Status codes {#post-stop-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | The `node_uid` doesn't match a node in the cluster (`error_code`: `node_not_found`). |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Internal server error. |

## Delete granular metrics data {#delete-granular-data}

	DELETE /v1/metrics/granular/data

Delete granular metrics data from all nodes or from a specific node.

If granular collection is still running on any node in scope, the request fails with `409 Conflict`. The cluster is checked before any node's data is deleted, so a failed request deletes nothing. [Stop collection](#post-granular-stop) on those nodes first.

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#delete-request}

#### Example HTTP request

	DELETE /v1/metrics/granular/data

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| node_uid | integer | Optional. The ID of the node to delete granular data from. If omitted, deletes granular data from all nodes. |

### Response {#delete-response}

Returns a `results` array with one object for each node in scope.

#### Example JSON body

```json
{
  "results": [
    { "uid": "1", "outcome": "deleted", "freed_bytes": 131072000 },
    { "uid": "2", "outcome": "no_data" }
  ]
}
```

#### Result fields

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The node ID |
| outcome | string | Result on the node:<br />`deleted`: granular data was deleted.<br />`no_data`: the node had no granular data to delete. |
| freed_bytes | integer | Disk space freed, in bytes. Included with the `deleted` outcome. |

#### Example error response

If granular collection is still running on any node in scope, the response lists those nodes:

```json
{
  "error_code": "granular_metrics_running",
  "description": "cannot cleanup granular metrics — still running on 1 node(s)",
  "running_nodes": [ { "uid": "1", "started_at": 1771770600 } ]
}
```

### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | The `node_uid` doesn't match a node in the cluster (`error_code`: `node_not_found`). |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Granular collection is still running on at least one node in scope (`error_code`: `granular_metrics_running`). No data was deleted. |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Internal server error. |
