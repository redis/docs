---
Title: JSON schema requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: API object JSON schema requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: jsonschema
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-jsonschema) | `/v1/jsonschema` | Get JSON schema of API objects |

## Get object JSON schema {#get-jsonschema}

	GET /v1/jsonschema

Get the JSON schema of various [Redis Enterprise REST API objects]({{< relref "/operate/rs/references/rest-api/objects" >}}).

### Request {#get-request} 

#### Example HTTP request

	GET /v1/jsonschema?object=bdb 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| object | string | Optional. The API object name: 'cluster', 'node', 'bdb' etc. |

### Response {#get-response} 

Returns the JSON schema of the specified API object.

#### Example JSON body

```json
{
     "type": "object",
     "description": "An API object that represents a managed database in the cluster.",
     "properties": {
          "...."
     },
     "...."
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Invalid object. |
