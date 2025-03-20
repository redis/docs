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
| [GET](#get-crdb_task) | `/v1/crdb_tasks/{task_id}` | Get the status of an executed task |

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

### Response {#get-response} 

Returns a [CRDB task object]({{< relref "/operate/rs/references/rest-api/objects/crdb_task" >}}).

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Task status. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | Unauthorized request. Invalid credentials |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Task not found. |
