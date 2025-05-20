---
Title: Diagnostics requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests for the diagnostic logging service.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: diagnostics
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-diagnostics) | `/v1/diagnostics` | Get diagnostic logging service configuration |
| [PUT](#put-diagnostics) | `/v1/diagnostics` | Update diagnostic logging service configuration |

## Get diagnostic logging service configuration {#get-diagnostics}

```sh
GET /v1/diagnostics
```

Gets the diagnostic logging service configuration as JSON.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/diagnostics
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response}

Returns a JSON object that represents the diagnostic logging service configuration. Each target includes a `cron_expression` that defines the log collection time interval. `slowlog_target` also includes `max_entries`, which specifies the maximum number of entries recorded in the slow log.

#### Example response body

```json
{
    "bdb_client_list_target": {
        "cron_expression": "*/10 * * * *"
    },
    "bdb_info_target": {
        "cron_expression": "*/10 * * * *"
    },
    "bdb_target": {
        "cron_expression": "*/10 * * * *"
    },
    "command_stats_target": {
        "cron_expression": "*/30 * * * *"
    },
    "network_stats_target": {
        "cron_expression": "*/30 * * * *"
    },
    "persistent_files_target": {
        "cron_expression": "*/10 * * * *"
    },
    "rladmin_status_target": {
        "cron_expression": "*/10 * * * *"
    },
    "shard_info_target": {
        "cron_expression": "*/10 * * * *"
    },
    "shard_latency_histogram_target": {
        "cron_expression": "*/10 * * * *"
    },
    "shard_latency_target": {
        "cron_expression": "*/10 * * * *"
    },
    "shard_target": {
        "cron_expression": "*/10 * * * *"
    },
    "slowlog_target": {
        "cron_expression": "*/10 * * * *",
        "max_entries": 100
    },
    "socket_files_target": {
        "cron_expression": "*/10 * * * *"
    }
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |

## Update diagnostic logging service configuration {#put-diagnostics}

```sh
PUT /v1/diagnostics
```

Updates the diagnostic logging service configuration.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) | admin |

### Request {#put-request}

Provide a JSON object in the request body to update a diagnostic logging service target's configuration. Each target can include a `cron_expression` that defines the log collection time interval for that target. For `slowlog_target`, you can also change `max_entries`, which specifies the maximum number of entries recorded in the slow log.

#### Example HTTP request

```sh
PUT /v1/diagnostics
```

#### Example JSON body

```json
{
   "rladmin_status_target": {
     "cron_expression": "5 * * * *"
   }
}
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#put-response}

Returns a JSON object that represents the updated diagnostic logging service configuration. Each target includes a `cron_expression` that defines the log collection time interval. `slowlog_target` also includes `max_entries`, which specifies the maximum number of entries recorded in the slow log.


#### Example response body

```json
{
    "bdb_client_list_target": {
        "cron_expression": "*/10 * * * *"
    },
    "bdb_info_target": {
        "cron_expression": "*/10 * * * *"
    },
    "bdb_target": {
        "cron_expression": "*/10 * * * *"
    },
    "command_stats_target": {
        "cron_expression": "*/30 * * * *"
    },
    "network_stats_target": {
        "cron_expression": "*/30 * * * *"
    },
    "persistent_files_target": {
        "cron_expression": "*/10 * * * *"
    },
    "rladmin_status_target": {
        "cron_expression": "5 * * * *"
    },
    "shard_info_target": {
        "cron_expression": "*/10 * * * *"
    },
    "shard_latency_histogram_target": {
        "cron_expression": "*/10 * * * *"
    },
    "shard_latency_target": {
        "cron_expression": "*/10 * * * *"
    },
    "shard_target": {
        "cron_expression": "*/10 * * * *"
    },
    "slowlog_target": {
        "cron_expression": "*/10 * * * *",
        "max_entries": 100
    },
    "socket_files_target": {
        "cron_expression": "*/10 * * * *"
    }
}
```

#### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad content provided. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Attempting to configure the diagnostic logging service target while it is busy with another configuration change. In this context, this is a temporary condition, and the request should be re-attempted later. |
