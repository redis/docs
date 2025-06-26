---
Title: Node master healthcheck requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to check a node's connection to the cluster's primary node.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: node/master_healthcheck
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-node-master-healthcheck) | `/v1/local/node/master_healthcheck` | Checks a node's connection to the primary node |

## Get master healthcheck {#get-node-master-healthcheck}

```sh
GET /v1/local/node/master_healthcheck
```

Checks whether the current node has a valid connection to the cluster's primary node and the Cluster Configuration Store (CCS).

### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/local/node/master_healthcheck
```


#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


### Response {#get-response}

Returns a JSON object that includes the status of the current node's connection to the cluster's primary node and the CCS.

- `active`: the current node has a valid connection.

- `inactive`: the current node doesn't have a valid connection.

#### Example JSON response body

```json
{
  "status": "active"
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |
