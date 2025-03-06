---
Title: Cluster policy requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Cluster policy requests
headerRange: '[1-2]'
linkTitle: policy
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/cluster/policy/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-policy) | `/v1/cluster/policy` | Get cluster policy settings |
| [PUT](#put-cluster-policy) | `/v1/cluster/policy` | Update cluster policy settings |

## Get cluster policy {#get-cluster-policy}

	GET /v1/cluster/policy

Gets the cluster's current policy settings.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster/policy 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns a [cluster settings object]({{< relref "/operate/rs/references/rest-api/objects/cluster_settings" >}}).

#### Example JSON body

```json
{
    "db_conns_auditing": false,
    "default_non_sharded_proxy_policy": "single",
    "default_provisioned_redis_version": "6.0",
    "default_sharded_proxy_policy": "single",
    "default_shards_placement": "dense",
    "redis_upgrade_policy": "major",
    "// additional fields..."
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |

## Update cluster policy {#put-cluster-policy}

	PUT /v1/cluster/policy

Update cluster policy settings.

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#put-request} 

#### Example HTTP request

	PUT /v1/cluster/policy

#### Example JSON body

```json
{
    "default_shards_placement": "sparse",
    "default_sharded_proxy_policy": "all-nodes"
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include a [cluster settings object]({{< relref "/operate/rs/references/rest-api/objects/cluster_settings" >}}) with updated fields in the request body.

### Response {#put-response} 

Returns a status code that indicates the success or failure of the cluster settings update.

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Failed to set parameters |
