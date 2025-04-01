---
Title: Rebalance database requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to rebalance database shards
headerRange: '[1-2]'
linkTitle: rebalance
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bdbs/actions/rebalance/'
---

| Method | Path | Description |
|--------|------|-------------|
| [PUT](#put-bdbs-actions-rebalance) | `/v1/bdbs/{uid}/actions/rebalance` | Rebalance database shards |

## Rebalance database shards {#put-bdbs-actions-rebalance}

```sh
PUT /v1/bdbs/{int: uid}/actions/rebalance
```

Distributes the database's shards across nodes based on the database's shard placement policy. See [Shard placement policy]({{<relref "/operate/rs/databases/memory-performance/shard-placement-policy">}}) for more information about shard placement and available policies.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_info]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#put-request}

#### Example HTTP request

```sh
PUT /v1/bdbs/1/actions/rebalance
```

Dry-run example:

```sh
PUT /v1/bdbs/1/actions/rebalance?only_failovers=true&dry_run=true
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to rebalance. |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| dry_run | boolean | If true, returns the blueprint of the rebalanced database without actually changing the database. Default is false. |
| only_failovers | boolean | If true, only runs failovers and no migrations. Default is false. |
| max_operations | integer | Optional. The number of operations to do. Only works if `only_failovers` is true. If not provided, uses the number of the database's primary-replica pairs. |

### Response {#put-response}

- If `dry_run` is `false`, returns an `action_uid`. You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

- If `dry_run` is `true`, returns the balanced shards' blueprint.

  You can rearrange shards according to this blueprint if you use it in the `shards_blueprint` field of a [rearrange database shards]({{<relref "/operate/rs/references/rest-api/requests/bdbs/actions/optimize_shards_placement#put-bdbs-rearrange-shards">}}) request.
  
  You should also pass the rebalance shards' `cluster-state-id` response header as a request header of the rearrange database shards request to make sure the optimized shard placement is relevant for the current cluster state. The cluster will reject the update if its state changed since the optimal shards placement blueprint was generated.

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
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | When `dry_run` is false: The request is accepted and is being processed. When the database is recovered, its status will become active.<br />When `dry_run` is true: No error. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad request. Invalid input parameters. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Attempting to perform an action on a nonexistent database. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Not enough resources in the cluster to host the database. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Database is currently busy with another action, recovery is already in progress, or is not in a recoverable state. |
| [500 Internal Server Error](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error) | Internal server error. |
