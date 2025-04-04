---
Title: Syncer state requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Syncer state requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: syncer_state
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/bdbs/syncer_state/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-syncer-state) | `/v1/bdbs/{uid}/syncer_state` | Get a CRDB's syncer state |

## Get syncer state {#get-syncer-state}

```sh
GET /v1/bdbs/{int: uid}/syncer_state
```

Get a CRDB's syncer state as JSON.

{{<warning>}}
This endpoint is deprecated as of Redis Enterprise Software version 7.2.4 and will be removed in a future release. Use [`/v1/bdbs/<uid>/syncer_state/crdt`]({{< relref "/operate/rs/7.4/references/rest-api/requests/bdbs/syncer_state/crdt" >}}) instead.
{{</warning>}}

### Permissions

| Permission name | Roles   |
|-----------------|---------|
| [view_bdb_info]({{< relref "/operate/rs/7.4/references/rest-api/permissions#view_bdb_info" >}}) |  admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bdbs/1/syncer_state
```

#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster. |
| Accept | application/json |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database requested. |

### Response {#get-response}

Returns a JSON object that represents the syncer state.

#### Example JSON body

```json
{
    "DB": 22,
    "RunID": 1584086516,
    // additional fields...
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | OK |
| [404 Not Found](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Syncer state key does not exist |
| [500 Internal Server Error](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Internal error |
| [503 Service Unavailable](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.4) | Redis connection error, service unavailable |
