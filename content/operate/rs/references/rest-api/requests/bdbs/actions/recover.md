---
Title: Recover database action requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Recover database requests
headerRange: '[1-2]'
linkTitle: recover
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Get database recovery plan  |
| [POST](#post-bdbs-actions-recover) | `/v1/bdbs/{uid}/actions/recover` | Recover database  |

## Get recovery plan {#get-bdbs-actions-recover}

```sh
GET /v1/bdbs/{int: uid}/actions/recover
```

Fetch the recovery plan for a database. The recovery plan provides information about the recovery status, such as if it is possible, and specific detail on which available files to recovery from have been found.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_recovery_plan]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_recovery_plan" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#get-request}

#### Example HTTP request

```sh
GET /bdbs/1/actions/recover
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database for which recovery plan is required. |

### Response {#get-response}

TBA

#### Example JSON body

```json

```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Database UID does not exist |

## Recover database {#post-bdbs-actions-recover}

```sh
POST /v1/bdbs/{int: uid}/actions/recover
```

Initiate recovery for a database in recovery state.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [start_bdb_recovery]({{< relref "/operate/rs/references/rest-api/permissions#start_bdb_recovery" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request}

#### Example HTTP request

```sh
POST /bdbs/1/actions/recover
```

#### Example JSON request body

Example request, detailed recovery plan:

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

TBA

#### Example JSON body

```json

```

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | the request is accepted and is being processed. When the database is recovered, its status will become `active`. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | attempting to perform an action on a nonexistent database. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | database is currently busy with another action, recovery is already in progress, or is not in recoverable state. |
