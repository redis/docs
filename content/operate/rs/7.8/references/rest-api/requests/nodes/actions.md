---
Title: Node actions requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Node action requests
headerRange: '[1-2]'
linkTitle: actions
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/nodes/actions/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-nodes-actions) | `/v1/nodes/actions` | Get status of all actions on all nodes|
| [GET](#get-node-actions) | `/v1/nodes/{node_uid}/actions` | Get status of all actions on a specific node |
| [GET](#get-node-action) | `/v1/nodes/{node_uid}/actions/{action}` | Get status of an action on a specific node |
| [POST](#post-node-action) | `/v1/nodes/{node_uid}/actions/{action}` | Initiate node action |
| [DELETE](#delete-node-action) | `/v1/nodes/{node_uid}/actions/{action}` | Cancel action or remove action status |

## Get all actions {#get-all-nodes-actions}

```sh
GET /v1/nodes/actions
```

Get the status of all currently executing, pending, or completed
actions on all nodes.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_status_of_all_node_actions]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_status_of_all_node_actions" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-all-request}

#### Example HTTP request

```sh
GET /v1/nodes/actions
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-all-response}

Returns a list of [action objects]({{< relref "/operate/rs/7.8/references/rest-api/objects/action" >}}).

### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, response provides details about an ongoing action. |

## Get node actions statuses {#get-node-actions}

```sh
GET /v1/nodes/{node_uid}/actions
```

Get the status of all actions on a specific node.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_status_of_node_action]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_status_of_node_action" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request-all-actions}

#### Example HTTP request

```sh
GET /v1/nodes/1/actions
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| action | string | The action to check. |

### Response {#get-response-all-actions}

Returns a JSON object that includes a list of [action objects]({{< relref "/operate/rs/7.8/references/rest-api/objects/action" >}}) for the specified node.

If no actions are available, the response will include an empty array.

#### Example JSON body

```json
{
    "actions": [
        {
            "name": "remove_node",
            "node_uid": "1",
            "status": "running",
            "progress": 10
        }
    ]
}
```

### Error codes {#get-error-codes-all-actions}

| Code | Description |
|------|-------------|
| internal_error | An internal error that cannot be mapped to a more precise error code has been encountered. |
| insufficient_resources | The cluster does not have sufficient resources to complete the required operation. |

### Status codes {#get-status-codes-all-actions}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, response provides details about an ongoing action. |
| [404&nbsp;Not&nbsp;Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Action does not exist (i.e. not currently running and no available status of last run). |

## Get node action status {#get-node-action}

```sh
GET /v1/nodes/{node_uid}/actions/{action}
```

Get the status of a currently executing, queued, or completed action on a specific node.

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/nodes/1/actions/remove
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response}

Returns an [action object]({{< relref "/operate/rs/7.8/references/rest-api/objects/action" >}}) for the specified node.

### Error codes {#get-error-codes}

| Code | Description |
|------|-------------|
| internal_error | An internal error that cannot be mapped to a more precise error code has been encountered. |
| insufficient_resources | The cluster does not have sufficient resources to complete the required operation. |

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, response provides details about an ongoing action. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Action does not exist (i.e. not currently running and no available status of last run). |

## Initiate node action {#post-node-action}

```sh
POST /v1/nodes/{node_uid}/actions/{action}
```

Initiate a node action.

The API allows only a single instance of any action type to be
invoked at the same time, and violations of this requirement will
result in a `409 CONFLICT` response.

The caller is expected to query and process the results of the
previously executed instance of the same action, which will be
removed as soon as the new one is submitted.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [start_node_action]({{< relref "/operate/rs/7.8/references/rest-api/permissions#start_node_action" >}}) | admin |

### Request {#post-request}

#### Example HTTP request

```sh
POST /v1/nodes/1/actions/remove
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| action | string | The name of the action required. |

Currently supported actions are:

- `remove`: Removes the node from the cluster after migrating all bound resources to other nodes. As soon as a successful remove request is received, the cluster will no longer automatically migrate resources, such as shards and endpoints, to the node even if the remove task fails at some point.

    - By default, the remove node action completes after all resources migrate off the removed node. Node removal does not wait for migrated shards' persistence files to be created on the new nodes.
    
        To change node removal to wait for the creation of new persistence files for all migrated shards, set `wait_for_persistence` to `true` in the request body or [update the cluster policy]({{<relref "/operate/rs/7.8/references/rest-api/requests/cluster/policy#put-cluster-policy">}}) `persistent_node_removal` to `true` to change the cluster's default behavior.

        ```sh
        POST /v1/nodes/<node_id>/actions/remove
        {
            "wait_for_persistence": true
        }
        ```

- `maintenance_on`: Creates a snapshot of the node, migrates shards to other nodes, and prepares the node for maintenance. See [maintenance mode]({{< relref "/operate/rs/7.8/clusters/maintenance-mode" >}}) for more information.

    - As of Redis Enterprise Software version 7.4.2, a new node snapshot is created only if no maintenance mode snapshots already exist or if you set `"overwrite_snapshot": true` in the request body.

        ```sh
        POST /v1/nodes/1/actions/maintenance_on
        {
            "overwrite_snapshot": true
        }
        ```

    - If there aren't enough resources to migrate shards out of the maintained node, set `"evict_ha_replica": false` and `"evict_active_active_replica": false` in the request body to keep the replica shards in place but demote any master shards. Use these two parameters instead of `keep_slave_shards`, which is deprecated as of Redis Enterprise Software version 7.4.2.

        ```sh
        POST /v1/nodes/1/actions/maintenance_on
        {
            "overwrite_snapshot": true,
            "evict_ha_replica": false,
            "evict_active_active_replica": false
        }
        ```

    - To specify databases whose shards should be evicted from the node when entering maintenance mode, set `"evict_dbs": ["List of database ID strings"]` in the request body.

        ```sh
        POST /v1/nodes/1/actions/maintenance_on
        {
            "overwrite_snapshot": true,
            "evict_dbs": ["1", "3"] 
        }
        ```

- `maintenance_off`: Restores node to its previous state before maintenance started. See [maintenance mode]({{< relref "/operate/rs/7.8/clusters/maintenance-mode" >}}) for more information.

    - By default, it uses the latest node snapshot.

    - Use `"snapshot_name":`&nbsp;`"..."` in the request body to restore the state from a specific snapshot.

    - To avoid restoring shards at the node, use `"skip_shards_restore":`&nbsp;`true`.

- `enslave_node`: Turn node into a replica.

### Response {#post-response}

The body content may provide additional action details.

### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Action initiated successfully. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Only a single instance of any action type can be invoked at the same time. |

### Example requests

#### cURL

```sh
$ curl -k -X POST -u "[username]:[password]" -d "{}"
            https://[host][:port]/v1/nodes/1/actions/remove
```

#### Python

```python
import requests
import json

url = "https://[host][port]/v1/nodes/1/actions/remove"

payload = json.dumps({})
headers = {
  'Content-Type': 'application/json',
}
auth = ("[username]", "[password]")

response = requests.request("POST", url, auth=auth, headers=headers, data=payload)

print(response.text)
```

## Cancel action {#delete-node-action}

```sh
DELETE /v1/nodes/{node_uid}/actions/{action}
```

Cancel a queued or executing node action, or remove the status of a
previously executed and completed action.

### Permissions

| Permission name |
|-----------------|
| [cancel_node_action]({{< relref "/operate/rs/7.8/references/rest-api/permissions#cancel_node_action" >}}) |

### Request {#delete-request}

#### Example HTTP request

```sh
DELETE /v1/nodes/1/actions/remove
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| action | string | The name of the action to cancel. |

### Response {#delete-response}

Returns a status code.

#### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Action will be cancelled when possible. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Action unknown or not currently running. |
