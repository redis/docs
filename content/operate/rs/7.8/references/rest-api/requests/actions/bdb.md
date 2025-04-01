---
Title: Database actions requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Database actions requests
headerRange: '[1-2]'
linkTitle: bdb
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/actions/bdb/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-db-actions) | `/v1/actions/bdb/{bdb_uid}` | Get the status of a specific database's actions |

## Get database actions {#get-db-actions}

```
GET /v1/actions/bdb/{bdb_uid}
```

Get the status of all currently executing, pending, or completed state-machine-related actions for a specific database. This API tracks short-lived API requests that return `action_uid`.

#### Required permissions

| Permission name |
|-----------------|
| [view_status_of_cluster_action]({{< relref "/operate/rs/references/rest-api/permissions#view_status_of_cluster_action" >}}) |

### Request {#get-request}

#### Example HTTP request

```
GET /v1/actions/bdb/1
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| bdb_uid | string | Unique database ID |

### Response {#get-response}

Returns an array of JSON objects with attributes from [actions]({{< relref "/operate/rs/references/rest-api/objects/action" >}}) and [state machines]({{< relref "/operate/rs/references/rest-api/objects/state-machine" >}}).

Each action contains the following attributes: `name`, `action_uid`, `status`, and `progress`.

#### Example JSON body

```json
[
    {
        "action_uid": "8afc7f70-f3ae-4244-a5e9-5133e78b2e97",
        "heartbeat": 1703067908,
        "name": "SMUpdateBDB",
        "object_name": "bdb:1",
        "pending_ops": {},
        "progress": 50.0,
        "state": "proxy_policy",
        "status": "active"
    }
]
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, response provides info about state-machine actions |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | bdb not found |
