---
Title: Cluster actions requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Cluster action requests
headerRange: '[1-2]'
linkTitle: actions
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/cluster/actions/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-cluster-actions) | `/v1/cluster/actions` | Get the status of all actions  |
| [GET](#get-cluster-action) | `/v1/cluster/actions/{action}` | Get the status of a specific action |
| [POST](#post-cluster-action) | `/v1/cluster/actions/{action}` | Initiate a cluster-wide action |
| [DELETE](#delete-cluster-action) | `/v1/cluster/actions/{action}` | Cancel action or remove action status |

## Get all cluster actions {#get-all-cluster-actions}

	GET /v1/cluster/actions

Get the status of all currently executing, queued, or completed cluster actions.

#### Required permissions

| Permission name |
|-----------------|
| [view_status_of_cluster_action]({{< relref "/operate/rs/7.4/references/rest-api/permissions#view_status_of_cluster_action" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

    GET /v1/cluster/actions

### Response {#get-all-response} 

Returns a JSON array of [action objects]({{< relref "/operate/rs/7.4/references/rest-api/objects/action" >}}). 

#### Example JSON body

```json
{
    "actions": [
        {
            "name": "action_name",
            "status": "queued",
            "progress": 0.0
        }
    ]
}
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, response provides info about an ongoing action. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Action does not exist (i.e. not currently running and no available status of last run). |

## Get cluster action {#get-cluster-action}

	GET /v1/cluster/actions/{action}

Get the status of a currently executing, queued, or completed cluster action.

#### Required permissions

| Permission name |
|-----------------|
| [view_status_of_cluster_action]({{< relref "/operate/rs/7.4/references/rest-api/permissions#view_status_of_cluster_action" >}}) |

### Request {#get-request} 

#### Example HTTP request

    GET /v1/cluster/actions/action_name

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| action | string | The action to check. |

### Response {#get-response} 

Returns an [action object]({{< relref "/operate/rs/7.4/references/rest-api/objects/action" >}}). 

#### Example JSON body

```json
{
    "name": "action_name",
     "status": "queued",
    "progress": 0.0
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, response provides info about an ongoing action. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Action does not exist (i.e. not currently running and no available status of last run). |

## Initiate cluster-wide action {#post-cluster-action}

	POST /v1/cluster/actions/{action}

Initiate a cluster-wide action.

The API allows only a single instance of any action type to be
invoked at the same time, and violations of this requirement will
result in a `409 CONFLICT` response.

The caller is expected to query and process the results of the
previously executed instance of the same action, which will be
removed as soon as the new one is submitted.

#### Required permissions

| Permission name |
|-----------------|
| [start_cluster_action]({{< relref "/operate/rs/7.4/references/rest-api/permissions#start_cluster_action" >}}) |

### Request {#post-request} 

#### Example HTTP request

    POST /v1/cluster/actions/action_name

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| action | string | The name of the action required. |

Supported cluster actions:

- `change_master`: Promotes a specified node to become the primary node of the cluster, which coordinates cluster-wide operations. Include the `node_uid` of the node you want to promote in the request body.

    ```sh
    POST /v1/cluster/actions/change_master
    {
        "node_uid": "2"
    }
    ```

### Response {#post-response} 

The body content may provide additional action details. Currently, it is not used. 

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, action was initiated. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad action or content provided. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | A conflicting action is already in progress. |

## Cancel action {#delete-cluster-action}

	DELETE /v1/cluster/actions/{action}

Cancel a queued or executing cluster action, or remove the status of
a previously executed and completed action.

#### Required permissions

| Permission name |
|-----------------|
| [cancel_cluster_action]({{< relref "/operate/rs/7.4/references/rest-api/permissions#cancel_cluster_action" >}}) |

### Request {#delete-request} 

#### Example HTTP request

    DELETE /v1/cluster/actions/action_name

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| action | string | The name of the action to cancel, currently no actions are supported. |

### Response {#delete-response} 

Returns a status code.

### Status codes {#delete-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Action will be cancelled when possible. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Action unknown or not currently running. |
