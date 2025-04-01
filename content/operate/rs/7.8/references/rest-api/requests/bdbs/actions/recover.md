---
Title: Recover database requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests for database recovery
headerRange: '[1-2]'
linkTitle: recover
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bdbs/actions/recover/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Get database recovery plan  |
| [POST](#post-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Recover database  |

## Get recovery plan {#get-bdbs-actions-recover}

```sh
GET /v1/bdbs/{int: uid}/actions/recover
```

Fetches the recovery plan for a database. The recovery plan provides information about the recovery status, such as whether recovery is possible, and details on available files to use for recovery.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_recovery_plan]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_recovery_plan" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bdbs/1/actions/recover
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database. |

### Response {#get-response}

Returns a JSON object that represents the database's recovery plan, including recovery files and status.

#### Example response body

```json
{
  "data_files": [
    {
      "filename": "appendonly-1.aof",
      "last_modified": 1721164863.8883622,
      "node_uid": "1",
      "shard_role": "master",
      "shard_slots": "1-2048",
      "shard_uid": "1",
      "size": 88
    },
    {
      "filename": "appendonly-2.aof",
      "last_modified": 1721164863.8883622,
      "node_uid": "2",
      "shard_role": "slave",
      "shard_slots": "2049-4096",
      "shard_uid": "2",
      "size": 88
    }
  ],
  "status": "ready"
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Database UID does not exist. |

## Recover database {#post-bdbs-actions-recover}

```sh
POST /v1/bdbs/{int: uid}/actions/recover
```

Initiates [recovery for a database]({{<relref "operate/rs/databases/recover">}}) in a recoverable state where all the database's files are available after [cluster recovery]({{<relref "/operate/rs/clusters/cluster-recovery">}}).

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [start_bdb_recovery]({{< relref "/operate/rs/references/rest-api/permissions#start_bdb_recovery" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request}

The request body can either be empty or include a recovery plan.

If the request body is empty, the database will be recovered automatically:

- Databases with no persistence are recovered with no data.

- Persistent files such as AOF or RDB will be loaded from their expected storage locations where replica or primary shards were last active.

- If persistent files are not found where expected but can be located on other cluster nodes, they will be used.

#### Example HTTP request

```sh
POST /v1/bdbs/1/actions/recover
```

#### Example request body

```json
{
  "data_files": [
    {
      "filename": "appendonly-1.aof",
      "node_uid": "1",
      "shard_slots": "1-2048"
    },
    {
      "filename": "appendonly-2.aof",
      "node_uid": "2",
      "shard_slots": "2049-4096"
    }
  ],
  "ignore_errors": false,
  "recover_without_data": false
}
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to recover. |

### Response {#post-response}

Returns a status code. Also returns a JSON object with an `action_uid` in the request body if successful.

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | The request is accepted and is being processed. When the database is recovered, its status will become `active`. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Attempting to perform an action on a nonexistent database. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Database is currently busy with another action, recovery is already in progress, or is not in a recoverable state. |
