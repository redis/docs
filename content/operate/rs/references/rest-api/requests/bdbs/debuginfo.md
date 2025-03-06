---
Title: Database debug info requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the Redis Enterprise Software REST API /bdbs/debuginfo requests.
headerRange: '[1-2]'
linkTitle: debuginfo
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-debuginfo-bdb) | `/v1/bdbs/debuginfo` | Get debug info from all databases |
| [GET](#get-debuginfo-bdb) | `/v1/bdbs/{bdb_uid}/debuginfo` | Get debug info from a specific database |

## Get debug info from all databases {#get-all-debuginfo-bdb}

	GET /v1/bdbs/debuginfo

Downloads a tar file that contains debug info from all databases.

#### Required permissions

| Permission name |
|-----------------|
| [view_debugging_info]({{< relref "/operate/rs/references/rest-api/permissions#view_debugging_info" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/bdbs/debuginfo

### Response {#get-all-response} 

Downloads the debug info in a tar file called `filename.tar.gz`. Extract the files from the tar file to access the debug info.

#### Response headers

| Key | Value | Description |
|-----|-------|-------------|
| Content-Type | application/x-gzip | Media type of request/response body |
| Content-Length | 653350 | Length of the response body in octets |
| Content-Disposition | attachment; filename=debuginfo.tar.gz | Display response in browser 

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Failed to get debug info. |


## Get database debug info {#get-debuginfo-bdb}

	GET /v1/bdbs/{int: bdb_uid}/debuginfo

Downloads a tar file that contains debug info from the database specified by `bdb_uid`.

#### Required permissions

| Permission name |
|-----------------|
| [view_debugging_info]({{< relref "/operate/rs/references/rest-api/permissions#view_debugging_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/bdbs/1/debuginfo

### Response {#get-response} 

Downloads the debug info in a tar file called `filename.tar.gz`. Extract the files from the tar file to access the debug info.

#### Response headers

| Key | Value | Description |
|-----|-------|-------------|
| Content-Type | application/x-gzip | Media type of request/response body |
| Content-Length | 653350 | Length of the response body in octets |
| Content-Disposition | attachment; filename=debuginfo.tar.gz | Display response in browser 

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Failed to get debug info. |
