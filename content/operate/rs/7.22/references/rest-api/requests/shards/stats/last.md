---
Title: Latest shards stats requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Most recent shard statistics requests
headerRange: '[1-2]'
linkTitle: last
weight: $weight
url: '/operate/rs/7.22/references/rest-api/requests/shards/stats/last/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-shards-stats-last) | `/v1/shards/stats/last` | Get most recent stats for all shards |
| [GET](#get-shard-stats-last) | `/v1/shards/stats/last/{uid}` | Get most recent stats for a specific shard |

## Get latest stats for all shards {#get-all-shards-stats-last}

	GET /v1/shards/stats/last

Get most recent statistics for all shards.

#### Required permissions

| Permission name |
|-----------------|
| [view_all_shard_stats]({{< relref "/operate/rs/7.22/references/rest-api/permissions#view_all_shard_stats" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/shards/stats/last?interval=1sec&stime=015-05-27T08:27:35Z 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week. Default: 1sec (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-all-response} 

Returns most recent [statistics]({{< relref "/operate/rs/7.22/references/rest-api/objects/statistics" >}}) for all shards.

#### Example JSON body

```json
{
   "1": {
      "interval": "1sec",
      "stime": "2015-05-28T08:27:35Z",
      "etime": "2015-05-28T08:28:36Z",
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
   "2": {
      "interval": "1sec",
      "stime": "2015-05-28T08:27:40Z",
      "etime": "2015-05-28T08:28:45Z",
      "// additional fields..."
   }
}
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | No shards exist |

## Get latest shard stats {#get-shard-stats-last}

	GET /v1/shards/stats/last/{int: uid}

Get most recent statistics for a specific shard.

#### Required permissions

| Permission name |
|-----------------|
| [view_shard_stats]({{< relref "/operate/rs/7.22/references/rest-api/permissions#view_shard_stats" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/shards/stats/last/1?interval=1sec&stime=2015-05-28T08:27:35Z 


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
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week. Default: 1sec. (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-response} 

Returns the most recent [statistics]({{< relref "/operate/rs/7.22/references/rest-api/objects/statistics" >}}) for the specified shard.

#### Example JSON body

```json
{
   "1": {
      "interval": "1sec",
      "stime": "2015-05-28T08:27:35Z",
      "etime": "2015-05-28T08:27:36Z",
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
   }
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Shard does not exist |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Shard isn't currently active |
