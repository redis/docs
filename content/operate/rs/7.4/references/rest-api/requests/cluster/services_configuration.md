---
Title: Cluster services configuration requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Cluster services configuration requests
headerRange: '[1-2]'
linkTitle: services_configuration
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/cluster/services_configuration/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-services_config) | `/v1/cluster/services_configuration` | Get cluster services settings |
| [PUT](#put-cluster-services_config) | `/v1/cluster/services_configuration` | Update cluster services settings |

## Get cluster services configuration {#get-cluster-services_config}

	GET /v1/cluster/services_configuration

Get cluster services settings.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/7.4/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster/services_configuration 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns a [services configuration object]({{< relref "/operate/rs/7.4/references/rest-api/objects/services_configuration" >}}).

#### Example JSON body

```json
{
     "cm_server": {
         "operating_mode": "disabled"
     },
     "mdns_server": {
         "operating_mode": "enabled"
     },
     "// additional services..."
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

## Update cluster services configuration {#put-cluster-services_config}

	PUT /v1/cluster/services_configuration

Update the cluster services settings.

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/7.4/references/rest-api/permissions#update_cluster" >}}) |

### Request {#put-request} 

#### Example HTTP request

	PUT /v1/cluster/services_configuration 

#### Example JSON body

```json
{
     "cm_server": {
         "operating_mode": "disabled"
     },
     "// additional services..."
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include a [services configuration object]({{< relref "/operate/rs/7.4/references/rest-api/objects/services_configuration" >}}) with updated fields in the request body.

### Response {#put-response} 

Returns the updated [services configuration object]({{< relref "/operate/rs/7.4/references/rest-api/objects/services_configuration" >}}).

#### Example JSON body

```json
{
     "cm_server": {
         "operating_mode": "disabled"
     },
     "mdns_server": {
         "operating_mode": "enabled"
     },
     "// additional services..."
}
```

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
