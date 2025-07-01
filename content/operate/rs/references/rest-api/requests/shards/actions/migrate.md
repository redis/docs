---
Title: Migrate shards requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to migrate database shards
headerRange: '[1-2]'
linkTitle: migrate
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-multi-shards) | `/v1/shards/actions/migrate` | Migrate multiple shards |
| [POST](#post-shard) | `/v1/shards/{uid}/actions/migrate` | Migrate a specific shard |

## Migrate multiple shards {#post-multi-shards}

    POST /v1/shards/actions/migrate

Migrates the list of given shard UIDs to the node specified by `target_node_uid`. The shards can be from multiple databases. This request is asynchronous.

For more information about shard migration use cases and considerations, see [Migrate database shards]({{<relref "/operate/rs/databases/migrate-shards">}}).

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [migrate_shard]({{< relref "/operate/rs/references/rest-api/permissions#migrate_shard" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-multi-request} 

#### Example HTTP request

	POST /v1/shards/actions/migrate

#### Example JSON body

```json
{
  "shard_uids": ["2","4","6"],
  "target_node_uid": 9,
  "override_rack_policy": false,
  "preserve_roles": false,
  "max_concurrent_bdb_migrations": 3
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body {#post-multi-request-body}

The request body is a JSON object that can contain the following fields:

| Field | Type | Description |
|-------|------|-------------|
| shard_uids | array of strings | List of shard UIDs to migrate. |
| target_node_uid | integer | UID of the node to where the shards should migrate. |
| override_rack_policy | boolean | If true, overrides and ignores rack-aware policy violations. |
| dry_run | boolean | Determines whether the migration is actually done. If true, will just do a dry run. If the dry run succeeds, the request returns a `200 OK` status code.  Otherwise, it returns a JSON object with an error code and description. |
| preserve_roles | boolean | If true, preserves the migrated shards' roles after migration. |
| max_concurrent_bdb_migrations | integer | The number of concurrent databases that can migrate shards. |

### Response {#post-multi-response} 

Returns a JSON object with an `action_uid`. You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

#### Example JSON body

```json
{
    "action_uid": "e5e24ddf-a456-4a7e-ad53-4463cd44880e",
    "description": "Migrate was triggered"
}
```

### Status codes {#post-multi-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Conflicting parameters. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | A list of shard UIDs is required and not given, a specified shard does not exist, or a node UID is required and not given. |
| [500 Internal Server Error](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error) | Migration failed. |


## Migrate shard {#post-shard}

    POST /v1/shards/{int: uid}/actions/migrate

Migrates the shard with the given `shard_uid` to the node specified by `target_node_uid`. If the shard is already on the target node, nothing happens. This request is asynchronous.

For more information about shard migration use cases and considerations, see [Migrate database shards]({{<relref "/operate/rs/databases/migrate-shards">}}).

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [migrate_shard]({{< relref "/operate/rs/references/rest-api/permissions#migrate_shard" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request} 

#### Example HTTP request

	POST /v1/shards/1/actions/migrate

#### Example JSON body

```json
{
    "target_node_uid": 9,
    "override_rack_policy": false,
    "preserve_roles": false
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the shard to migrate. |


#### Request body {#post-request-body}

The request body is a JSON object that can contain the following fields:

| Field | Type | Description |
|-------|------|-------------|
| target_node_uid | integer | UID of the node to where the shard should migrate. |
| override_rack_policy | boolean | If true, overrides and ignores rack-aware policy violations. |
| dry_run | boolean | Determines whether the migration is actually done. If true, will just do a dry run. If the dry run succeeds, the request returns a `200 OK` status code.  Otherwise, it returns a JSON object with an error code and description. |
| preserve_roles | boolean | If true, preserves the migrated shards' roles after migration. |

### Response {#post-response} 

Returns a JSON object with an `action_uid`. You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

#### Example JSON body

```json
{
    "action_uid": "e5e24ddf-a456-4a7e-ad53-4463cd44880e",
    "description": "Migrate was triggered"
}
```

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Shard does not exist, or node UID is required and not given. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Database is currently busy. |
