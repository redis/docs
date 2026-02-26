---
Title: Latest database stats requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Most recent database statistics requests
headerRange: '[1-2]'
linkTitle: last
weight: $weight
url: '/operate/rs/7.22/references/rest-api/requests/bdbs/stats/last/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-bdbs-stats-last) | `/v1/bdbs/stats/last` | Get most recent stats for all databases |
| [GET](#get-bdbs-stats-last) | `/v1/bdbs/stats/last/{uid}` | Get most recent stats for a specific database |

## Get latest stats for all databases {#get-all-bdbs-stats-last}

```sh
GET /v1/bdbs/stats/last
```

Get the most recent statistics for all databases.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_all_bdb_stats]({{< relref "/operate/rs/7.22/references/rest-api/permissions#view_all_bdb_stats" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-all-request}

#### Example HTTP request

1. Without metrics filter (returns all metrics by default)
    ```
    GET /v1/bdbs/stats/last
    ```

2. With metrics filter
    ```
    GET /v1/bdbs/stats/last?metrics=no_of_keys,used_memory
    ```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| metrics | string | Comma-separated list of metric names for which we want statistics (default is all). (optional) |

### Response {#get-all-response}

Returns [statistics]({{< relref "/operate/rs/7.22/references/rest-api/objects/statistics" >}}) for all databases.

#### Example JSON body

1. Without metrics filter (returns all metrics by default)
    ```json
    {
    "1": {
        "stime": "2015-05-28T08:06:37Z",
        "etime": "2015-05-28T08:06:44Z",
        "conns": 0.0,
        "egress_bytes": 0.0,
        "etime": "2015-05-28T08:06:44Z",
        "evicted_objects": 0.0,
        "expired_objects": 0.0,
        "ingress_bytes": 0.0,
        "instantaneous_ops_per_sec": 0.0,
        "last_req_time": "1970-01-01T00:00:00Z",
        "last_res_time": "1970-01-01T00:00:00Z",
        "used_memory": 5651336.0,
        "mem_size_lua": 35840.0,
        "monitor_sessions_count": 0.0,
        "no_of_keys": 0.0,
        "other_req": 0.0,
        "other_res": 0.0,
        "read_hits": 0.0,
        "read_misses": 0.0,
        "read_req": 0.0,
        "read_res": 0.0,
        "total_connections_received": 0.0,
        "total_req": 0.0,
        "total_res": 0.0,
        "write_hits": 0.0,
        "write_misses": 0.0,
        "write_req": 0.0,
        "write_res": 0.0
    },
    "2": {
        "stime": "2015-05-28T08:06:37Z",
        "etime": "2015-05-28T08:06:44Z",

        "// additional fields..."
    },

    "// Additional BDBs..."
    }
    ```

2. With metrics filter
    ```json
    {
    "1": {
      "etime": "2015-05-28T08:06:44Z",
      "used_memory": 5651576.0,
      "no_of_keys": 0.0,
      "stime": "2015-05-28T08:06:37Z"
    },
    "2": {
      "etime": "2015-05-28T08:06:44ZZ",
      "used_memory": 5651440.0,
      "no_of_keys": 0.0,
      "stime": "2015-05-28T08:06:37Z"
    },

    "// Additional BDBs.."
    }
    ```

### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | No bdbs exist |

## Get latest database stats {#get-bdbs-stats-last}

```sh
GET /v1/bdbs/stats/last/{int: uid}
```

Get the most recent statistics for a specific database.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_stats]({{< relref "/operate/rs/7.22/references/rest-api/permissions#view_bdb_stats" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bdbs/stats/last/1?metrics=no_of_keys,used_memory
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the requested BDB. |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| metrics | string | Comma-separated list of metric names for which we want statistics (default is all). (optional) |

### Response {#get-response}

Returns the most recent [statistics]({{< relref "/operate/rs/7.22/references/rest-api/objects/statistics" >}}) for a specific database.

#### Example JSON body

```json
{
   "1": {
     "etime": "2015-06-23T12:05:08Z",
     "used_memory": 5651576.0,
     "no_of_keys": 0.0,
     "stime": "2015-06-23T12:05:03Z"
   }
}
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | bdb does not exist |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | bdb isn't currently active |
| [503 Service Unavailable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.4) | bdb is in recovery state |
