---
Title: Bootstrap validation requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Boostrap validation requests
headerRange: '[1-2]'
linkTitle: validate
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bootstrap/validate/'
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-bootstrap-validate) | `/v1/bootstrap/validate/{action}` | Perform bootstrap validation |

## Bootstrap validation {#post-bootstrap-validate}

	POST /v1/bootstrap/validate/{action}

Perform bootstrap validation.

Unlike actual bootstrapping, this request blocks and immediately
returns with a response.

### Request {#post-request}

#### Example HTTP request

    POST /v1/bootstrap/validate/join_cluster

#### Request body

The request must contain a [bootstrap configuration object]({{< relref "/operate/rs/7.8/references/rest-api/objects/bootstrap" >}}), similar to the one used for actual bootstrapping.

### Response {#post-response} 

If an error occurs, the call returns a `bootstrap_status` JSON object that contains the following fields:

| Field | Description |
|-------|-------------|
| state | Current bootstrap state.<br></br>`idle`: No bootstrapping started.<br></br>`initiated`: Bootstrap request received.<br></br>`creating_cluster`: In the process of creating a new cluster.<br></br>`joining_cluster`: In the process of joining an existing cluster.<br></br>`error`: The last bootstrap action failed.<br></br>`completed`: The last bootstrap action completed successfully.|
| start_time | Bootstrap process start time |
| end_time | Bootstrap process end time |
| error_code | If state is `error`, this error code describes the type of error encountered. |
| error_details | An error-specific object that may contain additional information about the error. A common field in use is `message` which provides a more verbose error message.

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error, validation was successful. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Validation failed, bootstrap status is returned as body. |
