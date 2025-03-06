---
Title: Shard failover requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to fail over database shards
headerRange: '[1-2]'
linkTitle: failover
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-multi-shards) | `/v1/shards/actions/failover` | Fail over multiple shards |
| [POST](#post-shard) | `/v1/shards/{uid}/actions/failover` | Fail over a specific shard |

## Fail over multiple shards {#post-multi-shards}

    POST /v1/shards/actions/failover

Performs failover on the primary shards specified by `shard_uids` in the request body, and promotes their replicas to primary shards. This request is asynchronous.

The cluster automatically manages failover to ensure high availability. Use this failover REST API request only for testing and planned maintenance.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [failover_shard]({{< relref "/operate/rs/references/rest-api/permissions#failover_shard" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-multi-request} 

#### Example HTTP request

	POST /v1/shards/actions/failover

#### Example JSON body

```json
{
    "shard_uids": ["2","4","6"]
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
| shard_uids | array of strings | List of primary shard UIDs to fail over. The shards must belong to the same database. |
| dead_uids | array of strings | Primary shards to avoid stopping. Optional. |
| dead_nodes | array of strings | Nodes that should not be drained or used for promoted replica shards. Optional. |
| dry_run | boolean | Determines whether the failover is actually done. If true, will just do a dry run. If the dry run succeeds, the request returns a `200 OK` status code.  Otherwise, it returns a JSON object with an error code and description. Optional. |
| force_rebind | boolean | Rebind after promotion. Optional. |
| redis_version_upgrade | string | New version of the promoted primary shards. Optional. |

### Response {#post-multi-response} 

Returns a JSON object with an `action_uid`. You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

#### Example JSON body

```json
{
    "action_uid": "e5e24ddf-a456-4a7e-ad53-4463cd44880e",
    "description": "Failover was triggered"
}
```

### Status codes {#post-multi-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Shard is a replica or the specified failover shards are not in the same database. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | A list of shard UIDs is required and not given, or a specified shard does not exist. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Database is currently busy. |

### Error codes {#put-multi-error-codes}

When errors are reported, the server may return a JSON object with `error_code` and `message` field that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| db_busy | Database is currently busy. |
| failover_shards_different_bdb | All failover shards should be in the same database. |
| shard_is_slave | Shard is a replica. |
| shard_not_exist | Shard does not exist. |
| shard_uids_required | List of shard UIDs is required and not given. |

## Fail over shard {#post-shard}

    POST /v1/shards/{int: uid}/actions/failover

Performs failover on the primary shard with the specified `shard_uid`, and promotes its replica shard to a primary shard. This request is asynchronous.

The cluster automatically manages failover to ensure high availability. Use this failover REST API request only for testing and planned maintenance.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [failover_shard]({{< relref "/operate/rs/references/rest-api/permissions#failover_shard" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request} 

#### Example HTTP request

	POST /v1/shards/1/actions/failover

#### Example JSON body

```json
{
    "force_rebind": true
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
| uid | integer | The unique ID of the shard to fail over. |


#### Request body {#post-request-body}

The request body is a JSON object that can contain the following fields:

| Field | Type | Description |
|-------|------|-------------|
| dead_uid | string | Primary shard to avoid stopping. Optional. |
| dead_nodes | array of strings | Nodes that should not be drained or used for promoted replica shards. Optional. |
| dry_run | boolean | Determines whether the failover is actually done. If true, will just do a dry run. If the dry run succeeds, the request returns a `200 OK` status code.  Otherwise, it returns a JSON object with an error code and description. Optional. |
| force_rebind | boolean | Rebind after promotion. Optional. |
| redis_version_upgrade | string | New version of the promoted primary shards. Optional. |

### Response {#post-response} 

Returns a JSON object with an `action_uid`. You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

#### Example JSON body

```json
{
    "action_uid": "e5e24ddf-a456-4a7e-ad53-4463cd44880e",
    "description": "Failover was triggered"
}
```

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Shard is a replica. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Specified shard does not exist. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Database is currently busy. |

### Error codes {#put-error-codes}

When errors are reported, the server may return a JSON object with `error_code` and `message` field that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| db_busy | Database is currently busy. |
| shard_is_slave | Shard is a replica. |
| shard_not_exist | Shard does not exist. |
