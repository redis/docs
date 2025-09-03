---
Title: Configure module requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure module requests
headerRange: '[1-2]'
linkTitle: config/bdb
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-modules-config-bdb) | `/v1/modules/config/bdb/{uid}` | Configure module |

## Configure module {#post-modules-config-bdb}

	POST /v1/modules/config/bdb/{string: uid}

Use the module runtime configuration command (if defined) to configure new arguments for the module.

#### Required permissions

| Permission name |
|-----------------|
| [edit_bdb_module]({{< relref "/operate/rs/references/rest-api/permissions#edit_bdb_module" >}}) |

### Request {#post-request} 

#### Example HTTP request

	POST /v1/modules/config/bdb/1

#### Example JSON body

```json
{
  "modules": [
    {
      "module_name": "search",
      "module_args": "MINPREFIX 3 MAXEXPANSIONS 1000"
    }
  ]
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Request body

| Field | Type | Description |
|-------|------|-------------|
| modules | list of JSON objects | List of modules (module_name) and their new configuration settings (module_args) |
| module_name | `search`<br />`ReJSON`<br />`graph`<br />`timeseries`<br />`bf` | Module's name |
| module_args | string | Module command line arguments (pattern does not allow special characters &,<,>,") |

### Response {#post-response} 

Returns a status code. If an error occurs, the response body may include an error code and message with more details.

### Error codes {#post-error-codes} 

When errors are reported, the server may return a JSON object with `error_code` and `message` field that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| db_not_exist | Database with given UID doesn't exist in cluster | 
| missing_field | "module_name" or "module_args" are not defined in request | 
| invalid_schema | JSON object received is not a dict object | 
| param_error | "module_args" parameter was not parsed properly | 
| module_not_exist | Module with given "module_name" does not exist for the database | 

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, module updated on bdb. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | bdb not found. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing configuration parameters. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Module does not support runtime configuration of arguments. |
