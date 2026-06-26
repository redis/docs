---
Title: CRDB tasks requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Active-Active database task status requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: crdb_tasks
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-crdb_tasks) | `/v1/crdb_tasks` | Get all running tasks |
| [GET](#get-crdb_task) | `/v1/crdb_tasks/{task_id}` | Get the status of an executed task |
| [POST](#post-crdb_task-cancel) | `/v1/crdb_tasks/{task_id}/actions/cancel` | Cancel a running or queued task |

## Get all running tasks {#get-all-crdb_tasks}

```sh
GET /v1/crdb_tasks
```

Get all running tasks.

### Request {#get-all-request}

#### Example HTTP request

```sh
GET /v1/crdb_tasks
```

### Response {#get-all-response}

Returns a JSON array of [CRDB task objects]({{< relref "/operate/rs/references/rest-api/objects/crdb_task" >}}).

#### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | A list of running tasks. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | Unauthorized request. Invalid credentials. |

## Get task status {#get-crdb_task}

	GET /v1/crdb_tasks/{task_id}

Get the status of an executed task.

The status of a completed task is kept for 500 seconds by default.

### Request {#get-request} 

#### Example HTTP request

    GET /v1/crdb_tasks/1

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| X-Result-TTL | integer | Task time to live |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| task_id | string | Task ID |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| verbose | boolean | Return detailed task information (optional) |

### Response {#get-response} 

Returns a [CRDB task object]({{< relref "/operate/rs/references/rest-api/objects/crdb_task" >}}).

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Task status. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | Unauthorized request. Invalid credentials |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Task not found. |

## Cancel task {#post-crdb_task-cancel}

```sh
POST /v1/crdb_tasks/{task_id}/actions/cancel
```

Gracefully cancels a running or queued task.

A task that already reached the commit phase cannot be canceled.

### Request {#post-cancel-request}

#### Example HTTP request

```sh
POST /v1/crdb_tasks/1/actions/cancel
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| task_id | string | Task ID |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| force | boolean | Cancel even if the task is in the commit phase. **WARNING**: This can break the CRDB in the cluster configuration store (CCS), so use with caution. (optional) |

### Response {#post-cancel-response}

Returns a status code.

#### Status codes {#post-cancel-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | The request has been accepted. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | Unauthorized request. Invalid credentials. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Task not found. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Task cannot be canceled. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Failed to cancel task. |
