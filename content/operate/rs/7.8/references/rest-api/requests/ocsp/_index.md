---
Title: OCSP requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: OCSP requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: ocsp
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/ocsp/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-ocsp) | `/v1/ocsp` | Get OCSP configuration |
| [PUT](#put-ocsp) | `/v1/ocsp` | Update OCSP configuration |

## Get OCSP configuration {#get-ocsp}

	GET /v1/ocsp

Gets the cluster's OCSP configuration.

#### Required permissions

| Permission name |
|-----------------|
| [view_ocsp_config]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_ocsp_config" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/ocsp 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns an [OCSP configuration object]({{< relref "/operate/rs/7.8/references/rest-api/objects/ocsp" >}}).

#### Example JSON body

```json
{
    "ocsp_functionality": true,
    "responder_url": "http://responder.ocsp.url.com",
    "query_frequency": 3800,
    "response_timeout": 2,
    "recovery_frequency": 80,
    "recovery_max_tries": 20
}
```

### Error codes {#get-error-codes} 

When errors occur, the server returns a JSON object with `error_code` and `message` fields that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| ocsp_unsupported_by_capability | Not all nodes support OCSP capability | 

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Feature not supported in all nodes |

## Update OCSP configuration {#put-ocsp}

	PUT /v1/ocsp

Updates the cluster's OCSP configuration.

#### Required permissions

| Permission name |
|-----------------|
| [config_ocsp]({{< relref "/operate/rs/7.8/references/rest-api/permissions#config_ocsp" >}}) |

### Request {#put-request} 

#### Example HTTP request

	PUT /v1/ocsp 

#### Example JSON body

```json
{
    "ocsp_functionality": true,
    "query_frequency": 3800,
    "response_timeout": 2,
    "recovery_frequency": 80,
    "recovery_max_tries": 20
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include an [OCSP configuration object]({{< relref "/operate/rs/7.8/references/rest-api/objects/ocsp" >}}) with updated fields in the request body.

### Response {#put-response} 

Returns the updated [OCSP configuration object]({{< relref "/operate/rs/7.8/references/rest-api/objects/ocsp" >}}).

### Error codes {#put-error-codes} 

When errors occur, the server returns a JSON object with `error_code` and `message` fields that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| invalid_schema | An illegal parameter or a parameter with an illegal value |
| no_responder_url | Tried to enable OCSP with no responder URL configured |
| ocsp_unsupported_by_capability | Not all nodes support OCSP capability |

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, OCSP config has been set |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing configuration parameters |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Feature not supported in all nodes |
