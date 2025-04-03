---
Title: Usage report requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API request to get the database usage report from the cluster.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: usage_report
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-usage-report) | `/v1/usage_report` | Get the cluster's database usage report |

## Get usage report {#get-usage-report}

```sh
GET /v1/usage_report
```

Gets the database usage report from the cluster as a gzip file that contains Newline Delimited JSON (NDJSON). The final line in the file is the response's MD5 hash.

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/usage_report
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response}

Returns a gzip file that contains Newline Delimited JSON (NDJSON), which represents the usage report for every database in the cluster. The final line in the file is the response's MD5 hash.

| Field | Type/Value | Description |
|-------|------------|-------------|
| active_active | boolean | Indicates if Active-Active is enabled |
| api_version | string | API version |
| backup | boolean | Indicates if backup is enabled |
| bdb_uid | string | The database's unique ID |
| cluster_name | string | Cluster name |
| cluster_uuid | string | Cluster's unique ID |
| date | string | Date of the report, including time and time zone |
| dominant_shard_criteria | "mem"<br />"ops"<br />"rof" | Dominant criteria for shard selection |
| type | "core"<br />"premium"<br />"auto_tiering" | Database type |
| shard_type | "micro"<br />"normal"<br />"large"<br />"auto_tiering" | Shard type |
| no_eviction | boolean | Indicates if no eviction policy is applied |
| ops/sec | number | Consolidated ops/sec for the whole database |
| persistence | boolean | Indicates if persistence is enabled |
| provisioned_memory | number | Provisioned memory in bytes |
| replication | boolean | Indicates if replication is enabled |
| software_version | string | The Redis Enterprise Software version |
| used_memory | number | Used memory in bytes |
| using_redis_search | boolean | Indicates if RediSearch is in use |
| master_shards_count | number | Amount of primary shards |

#### Example response

```json
{
 "cluster_name": "mycluster.local",
 "cluster_uuid": "7e9f93c6-825e-4bbb-a067-7f6306b98609",
 "date": "2024-08-08T13:16:00.000000Z",
 "software_version": "7.0.0",
 "api_version" "1",
 "bdb_uid": "1",
 "type": "auto_tiering",
 "shard_type": "auto_tiering",
 "dominant_shard_criteria": "rof",
 "provisioned_memory": 1073741824,
 "used_memory": 5828776,
 "master_shards_count": 3,
 "no_eviction": false,
 "persistence": false,
 "backup": false,
 "using_redis_search": false,
 "ops_sec": 0,
 "replication": false,
 "active_active": false
}
{
 "cluster_name": "mycluster.local",
 "cluster_uuid": "7e9f93c6-825e-4bbb-a067-7f6306b98609",
 "date": "2024-08-08T13:17:00.000000Z",
 "software_version": "7.0.0",
 "api_version" "1",
 "bdb_uid": "1",
 "type": "auto_tiering",
 "shard_type": "auto_tiering",
 "dominant_shard_criteria": "rof",
 "provisioned_memory": 1073741824,
 "used_memory": 5828776,
 "master_shards_count": 3,
 "no_eviction": false,
 "persistence": false,
 "backup": false,
 "using_redis_search": false,
 "ops_sec": 0,
 "replication": false,
 "active_active": false
}
...
<MD5 hash of the entire response>
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Invalid date format |
| [503 Service Unavailable](https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable) | Unreachable node |
