---
Title: Database stats requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Database statistics requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: stats
weight: $weight
url: '/operate/rs/7.22/references/rest-api/requests/bdbs/stats/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-bdbs-stats) | `/v1/bdbs/stats` | Get stats for all databases |
| [GET](#get-bdbs-stats) | `/v1/bdbs/stats/{uid}` | Get stats for a specific database |

## Get all database stats {#get-all-bdbs-stats}

```sh
GET /v1/bdbs/stats
```

Get statistics for all databases.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_all_bdb_stats]({{< relref "/operate/rs/7.22/references/rest-api/permissions#view_all_bdb_stats" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-all-request}

#### Example HTTP request

```sh
GET /v1/bdbs/stats?interval=1hour&stime=2014-08-28T10:00:00Z
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-all-response}

Returns [statistics]({{< relref "/operate/rs/7.22/references/rest-api/objects/statistics" >}}) for all databases.

#### Example JSON body

```json
[
  {
    "uid": "1",
    "intervals": [
      {
         "interval": "1hour",
         "stime": "2015-05-27T12:00:00Z",
         "etime": "2015-05-28T12:59:59Z",
         "avg_latency": 0.0,
         "conns": 0.0,
         "egress_bytes": 0.0,
         "etime": "2015-05-28T00:00:00Z",
         "evicted_objects": 0.0,
         "expired_objects": 0.0,
         "ingress_bytes": 0.0,
         "instantaneous_ops_per_sec": 0.00011973180076628352,
         "last_req_time": "1970-01-01T00:00:00Z",
         "last_res_time": "1970-01-01T00:00:00Z",
         "used_memory": 5656299.362068966,
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
      {
         "interval": "1hour",
         "interval": "1hour",
         "stime": "2015-05-27T13:00:00Z",
         "etime": "2015-05-28T13:59:59Z",
         "avg_latency": 599.08,
         "// additional fields..."
      }
    ]
  },
  {
    "uid": "2",
    "intervals": [
      {
        "interval": "1hour",
        "stime": "2015-05-27T12:00:00Z",
        "etime": "2015-05-28T12:59:59Z",
        "avg_latency": 0.0,
        "// additional fields..."
      },
      {
        "interval": "1hour",
        "stime": "2015-05-27T13:00:00Z",
        "etime": "2015-05-28T13:59:59Z",

        "// additional fields..."
      }
    ]
  }
]
```

#### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | No bdbs exist |

### Example requests

#### cURL

```sh
$ curl -k -u "[username]:[password]" -X GET
        https://[host][:port]/v1/bdbs/stats?interval=1hour
```

#### Python

```python
import requests

url = "https://[host][:port]/v1/bdbs/stats?interval=1hour"
auth = ("[username]", "[password]")

response = requests.request("GET", url, auth=auth)

print(response.text)
```

## Get database stats {#get-bdbs-stats}

```sh
GET /v1/bdbs/stats/{int: uid}
```

Get statistics for a specific database.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_stats]({{< relref "/operate/rs/7.22/references/rest-api/permissions#view_bdb_stats" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bdbs/stats/1?interval=1hour&stime=2014-08-28T10:00:00Z
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the BDB requested. |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-response}

Returns [statistics]({{< relref "/operate/rs/7.22/references/rest-api/objects/statistics" >}}) for a specific database.

#### Example JSON body

```json
{
  "uid": "1",
  "intervals": [
    {
      "interval": "1hour",
      "stime": "2015-05-27T12:00:00Z",
      "etime": "2015-05-28T12:59:59Z",
      "avg_latency": 0.0,
      "conns": 0.0,
      "egress_bytes": 0.0,
      "evicted_objects": 0.0,
      "pubsub_channels": 0,
      "pubsub_patterns": 0,
      "expired_objects": 0.0,
      "ingress_bytes": 0.0,
      "instantaneous_ops_per_sec": 0.00011973180076628352,
      "last_req_time": "1970-01-01T00:00:00Z",
      "last_res_time": "1970-01-01T00:00:00Z",
      "used_memory": 5656299.362068966,
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
    {
      "interval": "1hour",
      "stime": "2015-05-27T13:00:00Z",
      "etime": "2015-05-28T13:59:59Z",
      "// additional fields..."
    }
  ]
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | bdb does not exist |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | bdb isn't currently active |
| [503 Service Unavailable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.4) | bdb is in recovery state |
