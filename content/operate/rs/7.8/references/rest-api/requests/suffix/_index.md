---
Title: Suffix requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: DNS suffix requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: suffix
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/suffix/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-suffix) | `/v1/suffix/{name}` | Get a single DNS suffix |

## Get suffix {#get-suffix}

	GET /v1/suffix/{string: name}

Get a single DNS suffix.

### Request {#get-request} 

#### Example HTTP request

	GET /v1/suffix/cluster.fqdn 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| name | string | The unique name of the suffix requested. |

### Response {#get-response} 

Returns a [suffix object]({{< relref "/operate/rs/references/rest-api/objects/suffix" >}}).

#### Example JSON body

```json
{
    "name": "cluster.fqdn",
    "// additional fields..."
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Suffix name does not exist |
