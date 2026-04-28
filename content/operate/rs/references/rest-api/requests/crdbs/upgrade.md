---
Title: CRDB upgrade requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrade Active-Active database requests
headerRange: '[1-2]'
linkTitle: upgrade
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-crdbs-upgrade) | `/v1/crdbs/{crdb_guid}/upgrade` | Upgrade an Active-Active database |

## Upgrade an Active-Active database {#post-crdbs-upgrade}

```sh
POST /v1/crdbs/{crdb_guid}/upgrade
```

Upgrades an Active-Active database. Upgrades the Redis version and modules of all instances in the Active-Active database.

### Request {#post-request}

#### Example HTTP request

```sh
POST /v1/crdbs/1/upgrade
```

#### Example JSON body

```json
{
    "preserve_roles": true,
    "may_discard_data": false,
    "redis_version": "8.2" //Uses the latest version if not specified
}
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| X-Task-ID | string | Specified task ID |
| X-Result-TTL | integer | Time (in seconds) to keep task result |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| crdb_guid | string | Globally unique Active-Active database ID (GUID) |

#### Request body

| Field | Type | Description |
|-------|------|-------------|
| force_discard | boolean | Discard data even if the database is replicated and/or persistent (default: false) |
| force_restart | boolean | Restart shards even if no version change (default: false) |
| keep_crdt_protocol_version | boolean | Keep current CRDT protocol version (default: false) |
| may_discard_data | boolean | Discard data in a non-replicated, non-persistent database (default: false) |
| modules | array | List of modules to upgrade with optional new arguments. Each object includes:<br>• `current_module`: UID of module to upgrade (deprecated as of Redis Software v7.8.2)<br>• `new_module`: UID of the module to upgrade to (deprecated as of Redis Software v7.8.2)<br>• `new_module_args`: Arguments for the new module |
| parallel_shards_upgrade | integer | Max number of shards to upgrade in parallel (default: all shards) |
| preserve_roles | boolean | Preserve shards' primary/replica roles; requires an extra failover (default: false) |
| redis_version | string | Upgrades the database to the specified Redis version instead of the latest version |

### Response {#post-response}

Returns a [CRDB task object]({{< relref "/operate/rs/references/rest-api/objects/crdb_task" >}}).

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Upgrade initiated successfully. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Request validation error. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | Unauthorized request. Invalid credentials. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Active-Active database not found. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | New module version capabilities don't comply with the database configuration. |
