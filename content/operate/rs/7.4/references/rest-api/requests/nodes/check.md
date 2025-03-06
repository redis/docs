---
Title: Check node requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Requests that run checks on a cluster node.
headerRange: '[1-2]'
linkTitle: check
toc: 'true'
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/nodes/check/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-node-check) | `/v1/nodes/check/{uid}` | Runs checks on a cluster node |

## Check node {#get-node-check}

	GET /v1/nodes/check/{int: uid}

Runs the following checks on a cluster node:

| Check name | Description |
|-----------|-------------|
| bootstrap_status | Verifies the local node's bootstrap process completed without errors. |
| services | Verifies all Redis Enterprise Software services are running. |
| port_range | Verifies the [`ip_local_port_range`](https://www.kernel.org/doc/html/latest/networking/ip-sysctl.html) doesn't conflict with the ports Redis Enterprise might assign to shards. |
| pidfiles | Verifies all active local shards have PID files. |
| capabilities | Verifies all binaries have the proper capability bits. |
| existing_sockets | Verifies sockets exist for all processes that require them. |
| host_settings | Verifies the following:<br />• Linux `overcommit_memory` setting is 1.<br />• `transparent_hugepage` is disabled.<br />• Socket maximum connections setting `somaxconn` is 1024. |
| tcp_connectivity | Verifies this node can connect to all other alive nodes. |

#### Required permissions

| Permission name |
|-----------------|
| [view_node_check]({{< relref "/operate/rs/references/rest-api/permissions#view_node_check" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/nodes/check/1


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The node's unique ID. |


### Response {#get-response} 

Returns a JSON object with the node's check results.

When errors occur, the server returns a JSON object with `result: false` and an `error` field that provides additional information. If an error occurs during a check, the `error` field only includes a message for the first check that fails.

Possible `error` messages:

- "bootstrap request to cnm_http failed,resp_code: ...,resp_content: ..."
- "process ... is not running or not responding (...)"
- "could not communicate with 'supervisorctl': ..."
- "connectivity check failed retrieving ports for testing"

#### Example JSON body

```json
{
    "node_uid": 1,
    "result": true
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
