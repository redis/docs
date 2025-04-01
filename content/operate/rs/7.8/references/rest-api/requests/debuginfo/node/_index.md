---
Title: Current node debug info requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the Redis Enterprise Software REST API debuginfo/node requests.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: node
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/debuginfo/node/'
---

{{<banner-article>}}
This REST API path is deprecated as of Redis Enterprise Software version 7.4.2. Use the new path [`/v1/nodes/debuginfo`]({{< relref "/operate/rs/references/rest-api/requests/nodes/debuginfo" >}}) instead.
{{</banner-article>}}

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-debuginfo-node) | `/v1/debuginfo/node` | Get debug info for the current node |

## Get debug info for current node {#get-debuginfo-node}

	GET /v1/debuginfo/node

Downloads a tar file that contains debug info for the current node.

#### Required permissions

| Permission name |
|-----------------|
| [view_debugging_info]({{< relref "/operate/rs/references/rest-api/permissions#view_debugging_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/debuginfo/node 

### Response {#get-response} 

Downloads the debug info in a tar file called `filename.tar.gz`. Extract the files from the tar file to access the debug info.

#### Response headers

| Key | Value | Description |
|-----|-------|-------------|
| Content-Type | application/x-gzip | Media type of request/response body |
| Content-Length | 653350 | Length of the response body in octets |
| Content-Disposition | attachment; filename=debuginfo.tar.gz | Display response in browser or download as attachment |

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Failed to get debug info. |
