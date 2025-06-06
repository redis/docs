---
Title: Database CRDT sources alerts requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Conflict-free replicated data type (CRDT) source alert requests
headerRange: '[1-2]'
linkTitle: crdt_sources/alerts
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bdbs/crdt_sources-alerts/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-bdbs-crdt-sources-alerts) | `/v1/bdbs/crdt_sources/alerts` | Get all CRDT sources alert states for all CRDB databases |
| [GET](#get-bdbs-crdt-sources-alerts) | `/v1/bdbs/crdt_sources/alerts/{uid}` | Get all CRDT sources alert states for a database |
| [GET](#get-bdbs-crdt-source-all-alerts) | `/v1/bdbs/crdt_sources/alerts/{uid}/{crdt_src_id}` | Get all alert states for a CRDT source |
| [GET](#get-bdbs-crdt-source-alert) | `/v1/bdbs/crdt_sources/alerts/{uid}/{crdt_src_id}/{alert}` | Get a database alert state |

## Get all CRDB CRDT source alert states {#get-all-bdbs-crdt-sources-alerts}

	GET /v1/bdbs/crdt_sources/alerts

Get all alert states for all CRDT sources of all CRDBs.

#### Required permissions

| Permission name |
|-----------------|
| [view_all_bdbs_alerts]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_all_bdbs_alerts" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/bdbs/crdt_sources/alerts 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-all-response} 

Returns a hash of alert UIDs and the [alerts states]({{< relref "/operate/rs/7.8/references/rest-api/objects/alert" >}}) for each local BDB of CRDB.

#### Example JSON body

```json
{
    "1": {
        "crdt_src_syncer_connection_error": {
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

## Get all BDB CRDT sources alert states {#get-bdbs-crdt-sources-alerts}

	GET /v1/bdbs/crdt_sources/alerts/{int: uid}

Get all alert states for all crdt sources for a specific local bdb of a CRDB.

#### Required permissions

| Permission name |
|-----------------|
| [view_bdb_alerts]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_bdb_alerts" >}}) |

### Request {#get-request-all-crdt-alerts} 

#### Example HTTP request

	GET /v1/bdbs/crdt_sources/alerts/1 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database |

### Response {#get-response-all-crdt-alerts} 

Returns a hash of [alert objects]({{< relref "/operate/rs/7.8/references/rest-api/objects/alert" >}}) and their states.

#### Example JSON body

```json
{
    "crdt_src_syncer_connection_error": {
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

### Status codes {#get-status-codes-all-crdt-alerts} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Specified bdb does not exist |

## Get all CRDT source alert states {#get-bdbs-crdt-source-all-alerts}

	GET /v1/bdbs/crdt_sources/alerts/{int: uid}/{int: crdt_src_id}

Get all alert states for specific crdt source for a specific local BDB
of a CRDB.

#### Required permissions

| Permission name |
|-----------------|
| [view_bdb_alerts]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_bdb_alerts" >}}) |

### Request {#get-request-crdt-alerts} 

#### Example HTTP request

	GET /v1/bdbs/crdt_sources/alerts/1/2 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database |
| crdt_src_id | integer | The ID of the crdt source in this BDB |

### Response {#get-response-crdt-alerts} 

Returns a hash of [alert objects]({{< relref "/operate/rs/7.8/references/rest-api/objects/alert" >}}) and their states. 

#### Example JSON body

```json
{
    "crdt_src_syncer_connection_error": {
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

### Status codes {#get-status-codes-crdt-alerts} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Specified bdb does not exist |

## Get database alert state {#get-bdbs-crdt-source-alert}

	GET /v1/bdbs/crdt_sources/alerts/{int: uid}/{int: crdt_src_id}/{alert}

Get a BDB alert state.

#### Required permissions

| Permission name |
|-----------------|
| [view_bdb_alerts]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_bdb_alerts" >}}) |

### Request {#get-request-alert} 

#### Example HTTP request

	GET /v1/bdbs/crdt_sources/alerts/1/2/crdt_src_syncer_connection_error 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database |
| crdt_src_id | integer | The ID of the crdt source in this BDB |
| alert | string | The alert name |

### Response {#get-response-alert} 

Returns an [alert object]({{< relref "/operate/rs/7.8/references/rest-api/objects/alert" >}}).

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

### Status codes {#get-status-codes-alert} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad request |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Specified alert or bdb does not exist |
