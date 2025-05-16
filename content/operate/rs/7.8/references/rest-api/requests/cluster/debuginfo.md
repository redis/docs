---
Title: Cluster debug info requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the Redis Enterprise Software REST API /cluster/debuginfo requests.
headerRange: '[1-2]'
linkTitle: debuginfo
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/cluster/debuginfo/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-debuginfo) | `/v1/cluster/debuginfo` | Get debug info from all nodes and databases |

## Get cluster debug info {#get-cluster-debuginfo}

	GET /v1/cluster/debuginfo

Downloads a tar file that contains debug info from all nodes and databases.

#### Required permissions

| Permission name |
|-----------------|
| [view_debugging_info]({{< relref "/operate/rs/7.8/references/rest-api/permissions#view_debugging_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster/debuginfo

### Response {#get-response} 

Downloads the debug info in a tar file called `filename.tar.gz`. Extract the files from the tar file to access the debug info for all nodes.

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
