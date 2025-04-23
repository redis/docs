---
Title: Suffixes requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: DNS suffixes requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: suffixes
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/suffixes/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-suffixes) | `/v1/suffixes` | Get all DNS suffixes |

## Get all suffixes {#get-all-suffixes}

	GET /v1/suffixes

Get all DNS suffixes in the cluster.

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/suffixes 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-all-response} 

The response body contains a JSON array with all suffixes, represented as [suffix objects]({{< relref "/operate/rs/7.4/references/rest-api/objects/suffix" >}}).

#### Example JSON body

```json
[
    {
        "name": "cluster.fqdn",
        "// additional fields..."
    },
    {
        "name": "internal.cluster.fqdn",
        "// additional fields..."
    }
]
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
