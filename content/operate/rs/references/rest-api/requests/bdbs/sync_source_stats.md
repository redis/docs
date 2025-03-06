---
Title: Database syncer source stats requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Syncer source statistics requests
headerRange: '[1-2]'
linkTitle: sync_source_stats
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-bdbs-sync_source_stats) | `/v1/bdbs/{bdb_uid}/sync_source_stats` | Get stats for all syncer sources |
| [GET](#get-bdbs-sync_source_stats) | `/v1/bdbs/{bdb_uid}/sync_source_stats/{uid}` | Get stats for a specific syncer instance |

## Get all syncer source stats {#get-all-bdbs-sync_source_stats}

```sh
GET /v1/bdbs/{bdb_uid}/sync_source_stats
```

Get stats for all syncer sources of a local database.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_stats]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_stats" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-all-request}

#### Example HTTP request

```sh
GET /v1/bdbs/1/sync_source_stats?interval=5min
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| bdb_uid | integer | The unique ID of the local database. |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | Optional end time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-all-response}

Returns [statistics]({{< relref "/operate/rs/references/rest-api/objects/statistics" >}}) for all syncer sources.

#### Example JSON body

```json
{ "sync_source_stats": [
     {
         "intervals": [
             {
                 "etime": "2017-10-22T19:30:00Z",
                 "ingress_bytes": 18528,
                 "ingress_bytes_decompressed": 185992,
                 "interval": "5min",
                 "local_ingress_lag_time": 0.244,
                 "stime": "2017-10-22T19:25:00Z"
             },
             {
                 "etime": "2017-10-22T19:35:00Z",
                 "ingress_bytes": 18,
                 "ingress_bytes_decompressed": 192,
                 "interval": "5min",
                 "local_ingress_lag_time": 0.0,
                 "stime": "2017-10-22T19:30:00Z"
             }
         ],
         "uid": "1"
     }
   ]
 }
```

### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Database does not exist. |

## Get syncer instance stats {#get-bdbs-sync_source_stats}

```sh
GET /v1/bdbs/{bdb_uid}/sync_source_stats/{int: uid}
```

Get stats for a specific syncer (Replica Of) instance.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_stats]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_stats" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bdbs/1/sync_source_stats/1?interval=5min
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| bdb_uid | integer | The unique ID of the local database. |
| uid | integer | The sync_source uid. |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week (optional) |
| stime | ISO_8601 | Optional start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | Optional end time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-response}

Returns [statistics]({{< relref "/operate/rs/references/rest-api/objects/statistics" >}}) for a specific syncer instance.

#### Example JSON body

```json
{
    "intervals": [
        {
            "etime": "2017-10-22T19:30:00Z",
            "ingress_bytes": 18528,
            "ingress_bytes_decompressed": 185992,
            "interval": "5min",
            "local_ingress_lag_time": 0.244,
            "stime": "2017-10-22T19:25:00Z"
        },
        {
            "etime": "2017-10-22T19:35:00Z",
            "ingress_bytes": 18,
            "ingress_bytes_decompressed": 192,
            "interval": "5min",
            "local_ingress_lag_time": 0.0,
            "stime": "2017-10-22T19:30:00Z"
        }
    ],
    "uid": "1"
}
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Database or sync_source do not exist. |
