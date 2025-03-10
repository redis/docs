---
Title: Cluster requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Cluster settings requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: cluster
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster) | `/v1/cluster` | Get cluster info |
| [PUT](#put-cluster) | `/v1/cluster` | Update cluster settings |

## Get cluster info {#get-cluster}

	GET /v1/cluster

Get cluster info.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns a [cluster object]({{< relref "/operate/rs/references/rest-api/objects/cluster" >}}).

#### Example JSON body

```json
{
   "name": "my-rlec-cluster",
   "alert_settings": { "..." },
   "created_time": "2015-04-29T09:09:25Z",
   "email_alerts": false,
   "email_from": "",
   "rack_aware": false,
   "smtp_host": "",
   "smtp_password": "",
   "smtp_port": 25,
   "smtp_tls_mode": "none",
   "smtp_username": ""
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

## Update cluster settings {#put-cluster}

	PUT /v1/cluster

Update cluster settings.

If called with the `dry_run` URL query string, the function will
validate the [cluster object]({{< relref "/operate/rs/references/rest-api/objects/cluster" >}}), but will not apply the requested
changes.

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#put-request} 

#### Example HTTP request

	PUT /v1/cluster 

#### Example JSON body

```json
{
    "email_alerts": true,
    "alert_settings": {
        "node_failed": true,
        "node_memory": {
            "enabled": true,
            "threshold": "80"
        }
    }
}
```

The above request will enable email alerts and alert reporting for node failures and node removals.

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| dry_run | string | Validate but don't apply the new cluster settings |

#### Request body

Include a [cluster object]({{< relref "/operate/rs/references/rest-api/objects/cluster" >}}) with updated fields in the request body.

### Response {#put-response} 

#### Example JSON body

```json
{
    "name": "mycluster.mydomain.com",
    "email_alerts": true,
    "alert_settings": {
        "node_failed": true,
        "node_memory": {
            "enabled": true,
            "threshold": "80"
        }
    },
    "// additional fields..."
}
```

### Error codes {#put-error-codes} 

When errors are reported, the server may return a JSON object with `error_code` and `message` field that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| bad_nginx_conf | • Designated port is already bound.<br></br>• nginx configuration is illegal. | 
| bad_debuginfo_path | • Debuginfo path doesn't exist.<br></br>• Debuginfo path is inaccessible. | 
| config_edit_conflict | Cluster config was edited by another source simultaneously. | 

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad content provided. |

