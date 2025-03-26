---
Title: Shards stats requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Shard statistics requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: stats
weight: $weight
aliases: /operate/rs/references/rest-api/requests/shards-stats/
url: '/operate/rs/7.4/references/rest-api/requests/shards/stats/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-shards-stats) | `/v1/shards/stats` | Get stats for all shards |
| [GET](#get-shard-stats) | `/v1/shards/stats/{uid}` | Get stats for a specific shard |

## Get all shards stats {#get-all-shards-stats}

	GET /v1/shards/stats

Get statistics for all shards.

#### Required permissions

| Permission name |
|-----------------|
| [view_all_shard_stats]({{< relref "/operate/rs/references/rest-api/permissions#view_all_shard_stats" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/shards/stats?interval=1hour&stime=2014-08-28T10:00:00Z 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| parent_uid | integer | Only return shard from the given BDB ID (optional) |
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| metrics | list | Comma-separated list of [metric names]({{< relref "/operate/rs/references/rest-api/objects/statistics/shard-metrics" >}}) for which we want statistics (default is all) (optional) |

### Response {#get-all-response} 

Returns a JSON array of [statistics]({{< relref "/operate/rs/references/rest-api/objects/statistics" >}}) for all shards.

#### Example JSON body

```json
[
  {
    "status": "active",
    "uid": "1",
    "node_uid": "1",
    "assigned_slots": "0-8191",
    "intervals": [
    {
      "interval": "1sec",
      "stime": "2015-05-28T08:27:35Z",
      "etime": "2015-05-28T08:27:40Z",
      "used_memory_peak": 5888264.0,
      "used_memory_rss": 5888264.0,
      "read_hits": 0.0,
      "pubsub_patterns": 0.0,
      "no_of_keys": 0.0,
      "mem_size_lua": 35840.0,
      "last_save_time": 1432541051.0,
      "sync_partial_ok": 0.0,
      "connected_clients": 9.0,
      "avg_ttl": 0.0,
      "write_misses": 0.0,
      "used_memory": 5651440.0,
      "sync_full": 0.0,
      "expired_objects": 0.0,
      "total_req": 0.0,
      "blocked_clients": 0.0,
      "pubsub_channels": 0.0,
      "evicted_objects": 0.0,
      "no_of_expires": 0.0,
      "interval": "1sec",
      "write_hits": 0.0,
      "read_misses": 0.0,
      "sync_partial_err": 0.0,
      "rdb_changes_since_last_save": 0.0
    },
    {
      "interval": "1sec",
      "stime": "2015-05-28T08:27:40Z",
      "etime": "2015-05-28T08:27:45Z",
      "// additional fields..."
      }
    ]
  },
  {
    "uid": "2",
    "status": "active",
    "node_uid": "1",
    "assigned_slots": "8192-16383",
    "intervals": [
      {
        "interval": "1sec",
        "stime": "2015-05-28T08:27:35Z",
        "etime": "2015-05-28T08:27:40Z",
        "// additional fields..."
      },
      {
        "interval": "1sec",
        "stime": "2015-05-28T08:27:40Z",
        "etime": "2015-05-28T08:27:45Z",
        "// additional fields..."
      }
    ]
  }
]
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | No shards exist |

## Get shard stats {#get-shard-stats}

	GET /v1/shards/stats/{int: uid}

Get statistics for a specific shard.

#### Required permissions

| Permission name |
|-----------------|
| [view_shard_stats]({{< relref "/operate/rs/references/rest-api/permissions#view_shard_stats" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/shards/stats/1?interval=1hour&stime=2014-08-28T10:00:00Z 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the shard requested. |


#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-response} 

Returns [statistics]({{< relref "/operate/rs/references/rest-api/objects/statistics" >}}) for the specified shard.

#### Example JSON body

```json
{
  "uid": "1",
  "status": "active",
  "node_uid": "1",
  "role": "master",
  "intervals": [
    {
      "interval": "1sec",
      "stime": "2015-05-28T08:24:13Z",
      "etime": "2015-05-28T08:24:18Z",
      "avg_ttl": 0.0,
      "blocked_clients": 0.0,
      "connected_clients": 9.0,
      "etime": "2015-05-28T08:24:18Z",
      "evicted_objects": 0.0,
      "expired_objects": 0.0,
      "last_save_time": 1432541051.0,
      "used_memory": 5651440.0,
      "mem_size_lua": 35840.0,
      "used_memory_peak": 5888264.0,
      "used_memory_rss": 5888264.0,
      "no_of_expires": 0.0,
      "no_of_keys": 0.0,
      "pubsub_channels": 0.0,
      "pubsub_patterns": 0.0,
      "rdb_changes_since_last_save": 0.0,
      "read_hits": 0.0,
      "read_misses": 0.0,
      "stime": "2015-05-28T08:24:13Z",
      "sync_full": 0.0,
      "sync_partial_err": 0.0,
      "sync_partial_ok": 0.0,
      "total_req": 0.0,
      "write_hits": 0.0,
      "write_misses": 0.0
    },
    {
      "interval": "1sec",
      "stime": "2015-05-28T08:24:18Z",
      "etime": "2015-05-28T08:24:23Z",

      "// additional fields..."
    }
  ]
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Shard does not exist |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Shard isn't currently active |
