---
Title: Migrations requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API request to get the migration status of a database in the cluster.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: migrations
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-migrations) | `/v1/migrations/<uid>` | Get database migration status |

## Get migration status {#get-migrations}

```sh
GET /v1/migrations/<uid>
```

Gets the migration status of a database in the cluster.

#### Required permissions

| Permission name |
|-----------------|
| [view_bdb_info]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_info" >}}) |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/migrations/1
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The database's unique ID |

### Response {#get-response}

Returns a JSON array with all data required by the Azure migration orchestrator.

#### Example response body

```json
"migration": {
    "status": "foo",
    "lag": 123,
    "run_id": "5",
    "flush_counter": 2,
    "source_shards": [{"replication_id": "1", "replication_offset": 2}]
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Database does not exist |
