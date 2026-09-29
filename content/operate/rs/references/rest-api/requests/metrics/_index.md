---
Title: Metrics requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Local metrics storage requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: metrics
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-metrics-status) | `/v1/metrics/status` | Get the local metrics storage status of cluster nodes |


## Get metrics status {#get-metrics-status}

	GET /v1/metrics/status

Get the status of all nodes or a specific node. The response describes the state of each node's store. It doesn't return the stored metrics.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request}

#### Example HTTP request

	GET /v1/metrics/status?node_uid=1

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
    {
      "uid": "1",
      "state": "running",
      "disk_usage_bytes": 471859200,
      "disk_max_bytes": 1073741824,
      "retention_days_configured": 8,
      "retention_days_effective": 6,
      "data_range": { "from": "2026-02-15T00:00Z", "to": "2026-02-23T10:00Z" },
      "health": "ok"
    }
  ]
}
```

#### Node status fields

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The node ID |
| state | string | State of the node's metrics store:<br />`running`<br />`stopped`<br />`unknown` |
| disk_usage_bytes | integer | Disk space used by stored metrics, in bytes |
| disk_max_bytes | integer | Configured maximum disk space for stored metrics, in bytes, set by [`local_storage_max_size_mb`]({{< relref "/operate/rs/references/rest-api/objects/metrics_config" >}}) |
| retention_days_configured | integer | Configured retention, in days, set by [`local_storage_retention_days`]({{< relref "/operate/rs/references/rest-api/objects/metrics_config" >}}) |
| retention_days_effective | integer | Retention currently in effect on the node, in days. It matches `retention_days_configured` unless the node has been under [storage pressure]({{< relref "/operate/rs/monitoring/metrics_stream_engine/local-metrics-storage#storage-pressure-retention" >}}), which lowers effective retention to keep stored data within `disk_max_bytes`. When the two values differ, the node keeps less history than configured. |
| data_range | object | Time range covered by the node's stored samples, with `from` and `to` timestamps |
| health | string | Health of the node's metrics store:<br />`ok`<br />`degraded`<br />`unknown` |

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | The `node_uid` doesn't match a node in the cluster (`error_code`: `node_not_found`). |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Internal server error. |
