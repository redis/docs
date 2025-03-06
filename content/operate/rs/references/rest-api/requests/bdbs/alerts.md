---
Title: Database alerts requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Database alert requests
headerRange: '[1-2]'
linkTitle: alerts
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-bdbs-alerts) | `/v1/bdbs/alerts` | Get all alert states for all databases |
| [GET](#get-bdbs-alerts) | `/v1/bdbs/alerts/{uid}` | Get all alert states for a specific database |
| [GET](#get-bdbs-alert) | `/v1/bdbs/alerts/{uid}/{alert}` | Get a specific database alert state |
| [POST](#post-bdbs-alerts) | `/v1/bdbs/alerts/{uid}` | Update a database’s alerts configuration |

## Get all database alerts {#get-all-bdbs-alerts}

	GET /v1/bdbs/alerts

Get all alert states for all databases.

#### Required permissions

| Permission name |
|-----------------|
| [view_all_bdbs_alerts]({{< relref "/operate/rs/references/rest-api/permissions#view_all_bdbs_alerts" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/bdbs/alerts 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-all-response}

Returns a hash of alert UIDs and the [alerts]({{< relref "/operate/rs/references/rest-api/objects/alert" >}}) states for each database.

#### Example JSON body

```json
{
    "1": {
        "bdb_size": {
            "enabled": true,
            "state": true,
            "threshold": "80",
            "change_time": "2014-08-29T11:19:49Z",
            "severity": "WARNING",
            "change_value": {
                "state": true,
                "threshold": "80",
                "memory_util": 81.2
            }
        },
        "..."
    },
    "..."
}
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

## Get database alerts {#get-bdbs-alerts}

	GET /v1/bdbs/alerts/{int: uid}

Get all alert states for a database.

#### Required permissions

| Permission name |
|-----------------|
| [view_bdb_alerts]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_alerts" >}}) |

### Request {#get-request-alerts} 

#### Example HTTP request

	GET /v1/bdbs/alerts/1 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response-alerts} 

Returns a hash of [alert objects]({{< relref "/operate/rs/references/rest-api/objects/alert" >}}) and their states.

#### Example JSON body

```json
{
    "bdb_size": {
        "enabled": true,
        "state": true,
        "threshold": "80",
        "severity": "WARNING",
        "change_time": "2014-08-29T11:19:49Z",
        "change_value": {
            "state": true,
            "threshold": "80",
            "memory_util": 81.2
        }
    },
    "..."
}
```

### Status codes {#get-status-codes-alerts} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Specified bdb does not exist |

## Get database alert {#get-bdbs-alert}

	GET /v1/bdbs/alerts/{int: uid}/{alert}

Get a database alert state.

#### Required permissions

| Permission name |
|-----------------|
| [view_bdb_alerts]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_alerts" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/bdbs/alerts/1/bdb_size 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database |
| alert | string | The alert name |

### Response {#get-response} 

Returns an [alert object]({{< relref "/operate/rs/references/rest-api/objects/alert" >}}).

#### Example JSON body

```json
{
    "enabled": true,
    "state": true,
    "threshold": "80",
    "severity": "WARNING",
    "change_time": "2014-08-29T11:19:49Z",
    "change_value": {
        "state": true,
        "threshold": "80",
        "memory_util": 81.2
    }
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad request |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Specified alert or bdb does not exist |

## Update database alert {#post-bdbs-alerts}

	POST /v1/bdbs/alerts/{int: uid}

Updates a database's alerts configuration.

#### Required permissions

| Permission name |
|-----------------|
| [update_bdb_alerts]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb_alerts" >}}) |

### Request {#post-request} 

If passed with the dry_run URL query string, the function will validate the alert thresholds, but not commit them.

#### Example HTTP request

	POST /v1/bdbs/alerts/1 

#### Example JSON body

```json
{
     "bdb_size":{
         "threshold":"80",
         "enabled":true
     },
     "bdb_high_syncer_lag":{
         "threshold":"",
         "enabled":false
     },
     "bdb_low_throughput":{
         "threshold":"1",
         "enabled":true
     },
     "bdb_high_latency":{
         "threshold":"3000",
         "enabled":true
     },
     "bdb_high_throughput":{
         "threshold":"1",
         "enabled":true
     },
     "bdb_backup_delayed":{
         "threshold":"1800",
         "enabled":true
     }
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | Database ID |
| dry_run | string | Validate the alert thresholds but do not apply them |

#### Request body

The request must contain a single JSON object with one or many database [alert objects]({{< relref "/operate/rs/references/rest-api/objects/alert" >}}).

### Response {#post-response} 

The response includes the updated database [alerts]({{< relref "/operate/rs/references/rest-api/objects/alert" >}}).

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Specified database was not found. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Invalid configuration parameters provided. |
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, database alerts updated. |
