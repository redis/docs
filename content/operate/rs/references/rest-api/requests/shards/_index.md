---
Title: Shard requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests for database shards
headerRange: '[1-2]'
hideListLinks: true
linkTitle: shards
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-shards) | `/v1/shards` | Get all shards |
| [GET](#get-shard) | `/v1/shards/{uid}` | Get a specific shard |

## Get all shards {#get-all-shards}

	GET /v1/shards

Get information about all shards in the cluster.

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/shards?extra_info_keys=used_memory_rss&extra_info_keys=connected_clients

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| extra_info_keys | list of strings | An optional list of extra keys to be fetched from the Redis [`INFO`]({{< relref "/commands/info" >}}) command. See [extra_info_keys](#extra_info_keys) for common keys to include. |

### Response {#get-all-response} 

Returns a JSON array of [shard objects]({{<relref "/operate/rs/references/rest-api/objects/shard">}}).

#### Example JSON body

```json
[
  {
    "uid": "1",
    "role": "master",
    "assigned_slots": "0-16383",
    "bdb_uid": 1,
    "detailed_status": "ok",
    "loading": {
      "status": "idle"
    },
    "node_uid": "1",
    "redis_info": {
			"connected_clients": 14,
			"used_memory_rss": 12263424
		},
    "report_timestamp": "2024-06-28T18:44:01Z",
    "status": "active"
  },
  {
    "uid": "2",
    "role": "slave",
    // additional fields...
  }
]
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |

## Get shard {#get-shard}

	GET /v1/shards/{int: uid}

Gets information about a single shard.

### Request {#get-request} 

#### Example HTTP request

	GET /v1/shards/1?extra_info_keys=used_memory_rss&extra_info_keys=connected_clients

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the requested shard. |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| extra_info_keys | list of strings | An optional list of extra keys to be fetched from the Redis [`INFO`]({{< relref "/commands/info" >}}) command. See [extra_info_keys](#extra_info_keys) for common keys to include. |

### Response {#get-response} 

Returns a [shard object]({{<relref "/operate/rs/references/rest-api/objects/shard">}}).

#### Example JSON body

```json
{
  "assigned_slots": "0-16383",
  "bdb_uid": 1,
  "detailed_status": "ok",
  "loading": {
    "status": "idle"
  },
  "node_uid": "1",
  "redis_info": {
		"connected_clients": 14,
		"used_memory_rss": 12263424
	},
  "role": "master",
  "report_timestamp": "2024-06-28T18:44:01Z",
  "status": "active",
  "uid": "1"
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Shard UID does not exist. |

## extra_info_keys

You can include any Redis [`INFO`]({{< relref "/commands/info" >}}) command key for shard requests using the `extra_info_keys` query parameter. The requested keys are returned in the `redis_info` object of the response.

See the following tables for common keys to include.

### Client keys

| Key | Type | Description |
|-----|------|-------------|
| blocked_clients | integer | Number of clients pending on a blocking call |
| client_recent_max_input_buffer | integer | Biggest input buffer among current client connections |
| client_recent_max_output_buffer | integer | Biggest output buffer among current client connections |
| connected_clients | integer | Number of client connections, excluding connections from replicas |

### Memory keys

| Key | Type | Description |
|-----|------|-------------|
| maxmemory | integer | Value of the maxmemory configuration directive |
| used_memory | integer | Total number of bytes allocated by Redis |
| used_memory_dataset | integer | Size in bytes of the dataset |
| used_memory_lua | integer | Number of bytes used by the Lua engine |
| used_memory_overhead | integer | Sum of all overheads that the server allocated for managing its internal data structures |
| used_memory_peak | integer | Peak memory in bytes consumed by Redis |
| used_memory_rss | integer | Number of bytes that Redis allocated as seen by the operating system |

### Persistence keys

| Key | Type | Description |
|-----|------|-------------|
| aof_enabled | integer | Flag indicating append-only file (AOF) logging is activated |
| aof_rewrite_in_progress | integer | Flag indicating an AOF rewrite operation is on-going |
| rdb_bgsave_in_progress | integer | Flag indicating an RDB save is on-going |
| rdb_changes_since_last_save | integer | Number of changes since the last dump |
| rdb_last_bgsave_status | string | Status of the last RDB save operation |
| rdb_last_save_time | integer | Epoch-based timestamp of last successful RDB save |

### Replication keys

| Key | Type | Description |
|-----|------|-------------|
| master_last_io_seconds_ago | integer | Number of seconds since the last interaction with the primary shard |
| master_repl_offset | integer | The server's current replication offset |
| slave_repl_offset | integer | Replication offset of the replica instance |

### Server keys

| Key | Type | Description |
|-----|------|-------------|
| configured_hz | integer | Server's configured frequency setting |
| hz | integer | Server's current frequency setting |
| redis_version | string | Version of the Redis server |
| uptime_in_days | integer | Number of days since Redis server start |
| uptime_in_seconds | integer | Number of seconds since Redis server start |

### Statistics keys

| Key | Type | Description |
|-----|------|-------------|
| instantaneous_ops_per_sec | integer | Number of commands processed per second |
| keyspace_hits | integer | Number of successful lookup of keys in the main dictionary |
| keyspace_misses | integer | Number of failed lookup of keys in the main dictionary |
| total_commands_processed | integer | Total number of commands processed by the server |
| total_connections_received | integer | Total number of connections accepted by the server |
| total_net_input_bytes | integer | Total number of bytes read from the network |
| total_net_output_bytes | integer | Total number of bytes written to the network |
