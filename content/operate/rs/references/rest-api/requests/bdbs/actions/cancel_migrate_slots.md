---
Title: Cancel migrate slots database action requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Cancel slot migrations between Redis instances (shards) within a database
headerRange: '[1-2]'
linkTitle: cancel_migrate_slots
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-bdbs-actions-cancel-migrate-slots) | `/v1/bdbs/{uid}/actions/cancel_migrate_slots` | Cancel slot migrations between Redis instances (shards) within a database |

## Cancel slot migrations {#post-bdbs-actions-cancel-migrate-slots}

```sh
POST /v1/bdbs/{int: uid}/actions/cancel_migrate_slots
```

Cancel slot migrations. If no JSON is provided in the request body, all slot migrations on the current database will be canceled.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [update_bdb_with_action]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb_with_action" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request}

Include the following parameters in the request JSON body to cancel specific slot migrations. If no request body is provided, all slot migrations for the database will be canceled.

| Field | Type | Description |
|-------|------|-------------|
| slots | string | Slot ranges to cancel migration for. |
| source_shard_uid | string | The unique ID of the source shard. |
| destination_shard_uid | string | The unique ID of the destination shard. |

#### Example HTTP request

```sh
POST /v1/bdbs/3/actions/cancel_migrate_slots

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

Returns a status indicating that the migration cancellation has been processed.

#### Example response

```json
{
    "status": "canceled"
}
```

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Migration canceled successfully. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Invalid request parameters. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Database or Redis instance not found. |
| [500 Internal Server Error](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error) | Internal server error. |
