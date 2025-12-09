---
Title: Migrate slots database action requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Migrate slots between Redis instances (shards) within a database
headerRange: '[1-2]'
linkTitle: migrate_slots
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-bdbs-actions-migrate-slots) | `/v1/bdbs/{uid}/actions/migrate_slots` | Migrate slots between Redis instances (shards) within a database |

## Migrate slots between shards {#post-bdbs-actions-migrate-slots}

```sh
POST /v1/bdbs/{int: uid}/actions/migrate_slots
```

Migrate slots between Redis instances (shards) within a database.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [update_bdb_with_action]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb_with_action" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request}

Include the following parameters in the request JSON body:

| Field | Type | Description |
|-------|------|-------------|
| slots | string | Slot ranges to migrate. |
| source_shard_uid | string | The unique ID of the source shard. |
| destination_shard_uid | string | The unique ID of the destination shard. |

#### Example HTTP request

```sh
POST /v1/bdbs/3/actions/migrate_slots

{
    "slots": "0-10,17-18",
    "source_shard_uid": "10",
    "destination_shard_uid": "11"
}
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database. |

### Response {#post-response}

Returns a status indicating that the migration has been initiated.

#### Example response

```json
{
    "status": "initiated"
}
```

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Migration initiated successfully. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Invalid request parameters. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Database or Redis instance not found. |
| [500 Internal Server Error](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error) | Internal server error. |
