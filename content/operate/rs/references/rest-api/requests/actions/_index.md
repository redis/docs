---
Title: Actions requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Actions requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: actions
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-actions) | `/v1/actions` | Get all actions |
| [GET](#get-all-actions-v2) | `/v2/actions` | Get all actions |
| [GET](#get-action) | `/v1/actions/{uid}` | Get a single action |
| [GET](#get-action-v2) | `/v2/actions/{uid}` | Get a single action |

## Get all actions {#get-all-actions}

```
GET /v1/actions
```

Get the status of all running, pending, or completed actions on all clusters, nodes, and databases. This API tracks long-lived API requests that return either a `task_id` or an `action_uid`.

This API does not return any information about other actions, such as import, export, and backup. To get info about these actions, use [`GET /v2/actions`](#get-all-actions-v2).

#### Required permissions

| Permission name |
|-----------------|
| [view_status_of_cluster_action]({{< relref "/operate/rs/references/rest-api/permissions#view_status_of_cluster_action" >}}) |

### Request {#get-all-request}

#### Example HTTP request

```
GET /v1/actions
```

### Response {#get-all-response}

Returns a JSON array of [action objects]({{< relref "/operate/rs/references/rest-api/objects/action" >}}), which represent tasks, and an array of [state-machine objects]({{< relref "/operate/rs/references/rest-api/objects/state-machine" >}}).

| Field | Type/Value | Description |
|-------|------------|-------------|
| action_uid | string | The action's globally unique identifier |
| name | string | Name of the running or failed state machine |
| progress | float (range: 0-100) | Percent of completed steps for the action |
| status | "pending"<br />"active"<br />"completed"<br />"failed" | The action's status |
| node_uid | string | UID of the node where the operation runs (optional) |
| object_name | string | The object that the action runs on (optional) |
| state | string | The current state of the state machine (optional)  |
| pending_ops | JSON object | List of operations that are waiting to run (optional)<br />{{<code>}}"pending_ops": {<br />  "3": {<br />    "heartbeat": integer,<br />    "snapshot": { ... },<br />    "last_sample_time": integer,<br />    "op_name": string,<br />    "status_code": string,<br />    "status_description": string,<br />    "progress": float<br />  }<br />}{{</code>}}<br />`pending_ops` is a map where the key is the `shard_id`, and the value is a map that can include the following optional fields:<br />**heartbeat**: The time, in seconds since the Unix epoch, since the last change in the progress of the operation.<br />**snapshot**: A map of properties stored by the operation that are needed to run.<br />**last_sample_time**: The time, in seconds since the Unix epoch, when the last snapshot of the operation was taken.<br />**op_name**: The name of the operation from the state machine that is running.<br />**status_code**: The code for the operation's current status.<br />**status_description**: The operation's current status.<br />**progress**: The operation's progress in percentage (1 to 100). |

Regardless of an action’s source, each action in the response contains the following attributes: `name`, `action_uid`, `status`, and `progress`.

#### Example JSON body

```json
{
  "actions": [
    {
      "action_uid": "159ca2f8-7bf3-4cda-97e8-4eb560665c28",
      "name": "retry_bdb",
      "node_uid": "2",
      "progress": "100",
      "status": "completed",
      "task_id": "159ca2f8-7bf3-4cda-97e8-4eb560665c28"
    },
    {
      "action_uid": "661697c5-c747-41bd-ab81-ffc8fd13c494",
      "name": "retry_bdb",
      "node_uid": "1",
      "progress": "100",
      "status": "completed",
      "task_id": "661697c5-c747-41bd-ab81-ffc8fd13c494"
    }
  ],
  "state-machines": [
    {
      "action_uid": "a10586b1-60bc-428e-9bc6-392eb5f0d8ae",
      "heartbeat": 1650378874,
      "name": "SMCreateBDB",
      "object_name": "bdb:1",
      "progress": 100,
      "status": "completed"
    }
  ]
}
```

### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error, response provides info about an ongoing action |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Action does not exist (i.e. not currently running and no available status of last run).|

## Get all actions {#get-all-actions-v2}

```
GET /v2/actions
```

Get the status of all currently running, pending, or completed actions from tasks, state-machines, and other actions, including import, export, and backup. This API tracks long-lived API requests that return either a `task_id` or an `action_uid`.

#### Required permissions

| Permission name |
|-----------------|
| [view_status_of_cluster_action]({{< relref "/operate/rs/references/rest-api/permissions#view_status_of_cluster_action" >}}) |

### Request {#get-all-request-v2}

#### Example HTTP request

```
GET /v2/actions
```

### Response {#get-all-response-v2}

Returns a JSON array of v2 [action objects]({{< relref "/operate/rs/references/rest-api/objects/action" >}}).

The v2 action object includes the following fields:

| Field | Type/Value | Description |
|-------|------------|-------------|
| action_uid | string | The action's globally unique identifier |
| action_type | "task"<br />"state-machine"<br />"other" | The action's type |
| creation_time | integer | The action's creation time. Unix timestamp in seconds. |
| name | string | Name of the running or failed state machine |
| progress | float (range: 0-100) | Percent of completed steps for the action |
| status | "pending"<br />"active"<br />"completed"<br />"failed" | The action's status |
| additional_info | JSON object | A dictionary that can include additional information about the action |

The `additional_info` object can contain any of the following fields:

| Field | Type/Value | Description |
|-------|------------|-------------|
| description | string | Short description of the action |
| error | string | A message that describes what error occurred if the action failed |
| object_type | string | The type of object that was processed in the action, such as BDB or node |
| object_uid | string | The unique ID of the object processed in the action |
| pending_ops | JSON object | List of operations that are waiting to run (optional)<br />{{<code>}}"pending_ops": {<br />  "3": {<br />    "heartbeat": integer,<br />    "snapshot": { ... },<br />    "last_sample_time": integer,<br />    "op_name": string,<br />    "status_code": string,<br />    "status_description": string,<br />    "progress": float<br />  }<br />}{{</code>}}<br />`pending_ops` is a map where the key is the `shard_id`, and the value is a map that can include the following optional fields:<br />**heartbeat**: The last time in seconds since the epoch when a snapshot of the operation was saved.<br />**snapshot**: A map of properties stored by the operation that are needed to run.<br />**last_sample_time**: The last time in seconds since the epoch when a snapshot of the operation was saved.<br />**op_name**: The name of the operation from the state machine that is running.<br />**status_code**: The code for the operation's current status.<br />**status_description**: The operation's current status.<br />**progress**: The operation's progress in percentage (1 to 100). |

Regardless of an action’s source, each action in the response contains the following attributes: `name`, `action_uid`, `status`, and `progress`.

#### Example JSON body

```json
[
    {
        "action_type": "task",
        "action_uid": "6155403f-c26f-40ab-8afc-23ed663973f6",
        "additional_info": {
            "object_type": "node",
            "object_uid": "1"
        },
        "creation_time": 1742595918,
        "name": "retry_bdb",
        "progress": 100.0,
        "status": "completed"
    },
    // Additional task objects
]
```

### Status codes {#get-all-status-codes-v2}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error, response provides info about an ongoing action |

## Get a specific action {#get-action}

```
GET /v1/actions/{uid}
```

Get the status of a specific action.

This API does not return any information about other actions, such as import, export, and backup. To get info about these actions, use [`GET /v2/actions/<uid>`](#get-action-v2).

#### Required permissions

| Permission name |
|-----------------|
| [view_status_of_cluster_action]({{< relref "/operate/rs/references/rest-api/permissions#view_status_of_cluster_action" >}}) |

### Request {#get-request}

#### Example HTTP request

```
GET /v1/actions/{uid}
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The action_uid to check |

### Response {#get-response}

Returns an [action object]({{< relref "/operate/rs/references/rest-api/objects/action" >}}).

| Field | Type/Value | Description |
|-------|------------|-------------|
| action_uid | string | The action's globally unique identifier |
| name | string | Name of the running or failed state machine |
| progress | float (range: 0-100) | Percent of completed steps for the action |
| status | "pending"<br />"active"<br />"completed"<br />"failed" | The action's status |
| node_uid | string | UID of the node where the operation runs (optional) |
| object_name | string | The object that the action runs on (optional) |
| state | string | The current state of the state machine (optional)  |
| pending_ops | JSON object | List of operations that are waiting to run (optional)<br />{{<code>}}"pending_ops": {<br />  "3": {<br />    "heartbeat": integer,<br />    "snapshot": { ... },<br />    "last_sample_time": integer,<br />    "op_name": string,<br />    "status_code": string,<br />    "status_description": string,<br />    "progress": float<br />  }<br />}{{</code>}}<br />`pending_ops` is a map where the key is the `shard_id`, and the value is a map that can include the following optional fields:<br />**heartbeat**: The time, in seconds since the Unix epoch, since the last change in the progress of the operation.<br />**snapshot**: A map of properties stored by the operation that are needed to run.<br />**last_sample_time**: The time, in seconds since the Unix epoch, when the last snapshot of the operation was taken.<br />**op_name**: The name of the operation from the state machine that is running.<br />**status_code**: The code for the operation's current status.<br />**status_description**: The operation's current status.<br />**progress**: The operation's progress in percentage (1 to 100). |

Regardless of an action’s source, each action contains the following attributes: `name`, `action_uid`, `status`, and `progress`.

#### Example JSON body

```json
{
  "action_uid": "159ca2f8-7bf3-4cda-97e8-4eb560665c28",
  "name": "retry_bdb",
  "node_uid": "2",
  "progress": "100",
  "status": "completed",
  "task_id": "159ca2f8-7bf3-4cda-97e8-4eb560665c28"
}
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error, response provides info about an ongoing action |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Action does not exist (i.e. not currently running and no available status of last run) |

## Get a specific action {#get-action-v2}

```
GET /v2/actions/{uid}
```

Get the status of a specific action. This API can also return information about actions like import, export, and backup.

#### Required permissions

| Permission name |
|-----------------|
| [view_status_of_cluster_action]({{< relref "/operate/rs/references/rest-api/permissions#view_status_of_cluster_action" >}}) |

### Request {#get-request-v2}

#### Example HTTP request

```
GET /v2/actions/{uid}
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The action_uid to check |

### Response {#get-response-v2}

Returns a v2 [action object]({{<relref "/operate/rs/references/rest-api/objects/action">}}).

The v2 action object includes the following fields:

| Field | Type/Value | Description |
|-------|------------|-------------|
| action_uid | string | The action's globally unique identifier |
| action_type | "task"<br />"state-machine"<br />"other" | The action's type |
| creation_time | integer | The action's creation time. Unix timestamp in seconds. |
| name | string | Name of the running or failed state machine |
| progress | float (range: 0-100) | Percent of completed steps for the action |
| status | "pending"<br />"active"<br />"completed"<br />"failed" | The action's status |
| additional_info | JSON object | A dictionary that can include additional information about the action |

The `additional_info` object can contain any of the following fields:

| Field | Type/Value | Description |
|-------|------------|-------------|
| description | string | Short description of the action |
| error | string | A message that describes what error occurred if the action failed |
| object_type | string | The type of object that was processed in the action, such as BDB or node |
| object_uid | string | The unique ID of the object processed in the action |
| pending_ops | JSON object | List of operations that are waiting to run (optional)<br />{{<code>}}"pending_ops": {<br />  "3": {<br />    "heartbeat": integer,<br />    "snapshot": { ... },<br />    "last_sample_time": integer,<br />    "op_name": string,<br />    "status_code": string,<br />    "status_description": string,<br />    "progress": float<br />  }<br />}{{</code>}}<br />`pending_ops` is a map where the key is the `shard_id`, and the value is a map that can include the following optional fields:<br />**heartbeat**: The last time in seconds since the epoch when a snapshot of the operation was saved.<br />**snapshot**: A map of properties stored by the operation that are needed to run.<br />**last_sample_time**: The last time in seconds since the epoch when a snapshot of the operation was saved.<br />**op_name**: The name of the operation from the state machine that is running.<br />**status_code**: The code for the operation's current status.<br />**status_description**: The operation's current status.<br />**progress**: The operation's progress in percentage (1 to 100). |

Regardless of an action’s source, each action contains the following attributes: `name`, `action_uid`, `status`, and `progress`.

#### Example JSON body

```json
{
    "action_type": "task",
    "action_uid": "6155403f-c26f-40ab-8afc-23ed663973f6",
    "additional_info": {
        "object_type": "node",
        "object_uid": "1"
    },
    "creation_time": 1742595918,
    "name": "retry_bdb",
    "progress": 100.0,
    "status": "completed"
}
```

### Status codes {#get-status-codes-v2}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error, response provides info about an ongoing action |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Action does not exist (i.e. not currently running and no available status of last run) |
