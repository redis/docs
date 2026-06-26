---
Title: OCSP test requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: OCSP test requests
headerRange: '[1-2]'
linkTitle: test
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-test) | `/v1/ocsp/test` | Test OCSP |

## Test OCSP {#post-test}

	POST /v1/ocsp/test

Queries the OCSP server for the proxy certificate’s latest status and returns the response as JSON. It caches the response if the OCSP feature is enabled.

#### Required permissions

| Permission name |
|-----------------|
| [test_ocsp_status]({{< relref "/operate/rs/references/rest-api/permissions#test_ocsp_status" >}}) |

### Request {#post-request} 

#### Example HTTP request

	POST /v1/ocsp/test 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#post-response} 

Returns an [OCSP status object]({{< relref "/operate/rs/references/rest-api/objects/ocsp_status" >}}).

#### Example JSON body

```json
{
    "responder_url": "http://responder.ocsp.url.com",
    "cert_status": "REVOKED",
    "produced_at": "Wed, 22 Dec 2021 12:50:11 GMT",
    "this_update": "Wed, 22 Dec 2021 12:50:11 GMT",
    "next_update": "Wed, 22 Dec 2021 14:50:00 GMT",
    "revocation_time": "Wed, 22 Dec 2021 12:50:04 GMT"
}
```

### Error codes {#post-error-codes} 

When errors occur, the server returns a JSON object with `error_code` and `message` fields that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| no_responder_url | Tried to test OCSP status with no responder URL configured |
| ocsp_unsupported_by_capability | Not all nodes support OCSP capability |
| task_queued_for_too_long | OCSP polling task was in status "queued" for over 5 seconds |
| invalid_ocsp_response | The server returned a response that is not compatible with OCSP |

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success querying the OCSP server |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Feature is not supported in all nodes |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | `responder_url` is not configured or polling task failed |
