---
Title: Revamp database requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to update database configuration and optimize shard placement
headerRange: '[1-2]'
linkTitle: revamp
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [PUT](#put-bdbs-actions-revamp) | `/v1/bdbs/{uid}/actions/revamp` | Update database configuration and optimize shard placement |

## Revamp database {#put-bdbs-actions-revamp}

```sh
PUT /v1/bdbs/{int: uid}/actions/revamp
```

Updates the topology-related configurations of an active database and optimizes the shard placement for the new configuration.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [update_bdb_with_action]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb_with_action" >}}) | admin<br />cluster_member<br />db_member |

### Request {#put-request}

You can include the following parameters in the request JSON body to update their values:

| Field | Type/Value | Description |
|-------|------------|-------------|
| avoid_nodes | array of strings | Cluster node UIDs to avoid when placing the database's shards and binding its endpoints. |
| bigstore_ram_size | integer | Memory size of bigstore RAM part. |
| memory_size | integer (default: 0) | Database memory limit in bytes. 0 is unlimited. |
| replication | boolean | If `true`, enable in-memory database replication mode. |
| shards_count | integer, (range: 1-512) (default: 1) | Number of database server-side shards. |
| shards_placement | "dense"<br />"sparse" | Control the density of shards. Values:<br />**dense**: Shards reside on as few nodes as possible.<br />**sparse**: Shards reside on as many nodes as possible. |

#### Example HTTP request

```sh
PUT /v1/bdbs/1/actions/revamp
{
    "replication": true,
    "shards_count": 12
}
```

Dry-run example:

```sh
PUT /v1/bdbs/1/actions/revamp?dry_run=true
{
  "replication": true,
  "shards_count": 12
}
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to update. |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| dry_run | boolean | If true, returns a blueprint of the database update without actually changing the database. Default is false. |
| pause_persistence | boolean | If true, pause the persistence during the update. Default is false. |

### Response {#put-response}

- If `dry_run` is `false`, returns an `action_uid`. You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

- If `dry_run` is `true`, returns a blueprint of the database update.

#### Example response

If `dry_run` is `false`:

```sh
{
  "action_uid": "21ad01d5-55aa-4ec6-b5c0-44dc95176486"
}
```

If `dry_run` is `true`:

```sh
[
  {
    "nodes": [
      {
        "node_uid": "3",
        "role": "master"
      },
      {
        "node_uid": "1",
        "role": "slave"
      }
    ],
    "slot_range": "5461-10922"
  },
  {
    "nodes": [
      {
        "node_uid": "3",
        "role": "master"
      },
      {
        "node_uid": "1",
        "role": "slave"
      }
    ],
    "slot_range": "10923-16383"
  },
  {
    "nodes": [
      {
        "node_uid": "3",
        "role": "master"
      },
      {
        "node_uid": "1",
        "role": "slave"
      }
    ],
    "slot_range": "0-5460"
  }
]
```

#### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | When `dry_run` is false: The request is accepted and is being processed. The database state will be `active-change-pending` until the request has been fully processed. <br />When `dry_run` is true: No error. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Attempting to perform an action on a nonexistent database. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | The requested configuration is invalid. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Attempting to change a database while it is busy with another configuration change. In this context, this is a temporary condition and the request should be re-attempted later. |
