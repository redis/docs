---
Title: All nodes debug info requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the Redis Enterprise Software REST API debuginfo/all requests.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: all
weight: $weight
url: '/operate/rs/7.22/references/rest-api/requests/debuginfo/all/'
---

{{<banner-article>}}
This REST API path is deprecated as of Redis Enterprise Software version 7.4.2. Use the new path [`/v1/cluster/debuginfo`]({{< relref "/operate/rs/7.22/references/rest-api/requests/cluster/debuginfo" >}}) instead.
{{</banner-article>}}

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-debuginfo) | `/v1/debuginfo/all` | Get debug info for all nodes |

## Get debug info for all nodes {#get-all-debuginfo}

	GET /v1/debuginfo/all

Downloads a tar file that contains debug info from all nodes.

#### Required permissions

| Permission name |
|-----------------|
| [view_debugging_info]({{< relref "/operate/rs/7.22/references/rest-api/permissions#view_debugging_info" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/debuginfo/all 

### Response {#get-all-response} 

Downloads the debug info in a tar file called `filename.tar.gz`. Extract the files from the tar file to access the debug info for all nodes.

#### Response headers

| Key | Value | Description |
|-----|-------|-------------|
| Content-Type | application/x-gzip | Media type of request/response body |
| Content-Length | 653350 | Length of the response body in octets |
| Content-Disposition | attachment; filename=debuginfo.tar.gz | Display response in browser or download as attachment |

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Failed to get debug info. |
