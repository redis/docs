---
Title: Modules requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Redis modules requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: modules
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/modules/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#list-modules) | `/v1/modules` | List available modules |
| [GET](#get-module) | `/v1/modules/{uid}` | Get a specific module |
| [POST](#post-module) | `/v1/modules` | Upload a new module (deprecated) |
| [POST](#post-module-v2) | `/v2/modules` | Upload a new module |
| [DELETE](#delete-module) | `/v1/modules/{uid}` | Delete a module (deprecated) |
| [DELETE](#delete-module-v2) | `/v2/modules/{uid}` | Delete a module |

## List modules {#list-modules}

```sh
GET /v1/modules
```

List available modules, i.e. modules stored within the CCS.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_cluster_modules]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_modules" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#list-request}

#### Example HTTP request

```sh
GET /v1/modules
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | 127.0.0.1:9443 | Domain name |
| Accept | \*/\* | Accepted media type |

### Response {#list-response}

Returns a JSON array of [module objects]({{< relref "/operate/rs/references/rest-api/objects/module" >}}).

#### Status codes {#list-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

## Get module {#get-module}

```sh
GET /v1/modules/{string: uid}
```

Get specific available modules, i.e. modules stored within the CCS.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_cluster_modules]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_modules" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/modules/1
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | 127.0.0.1:9443 | Domain name |
| Accept | \*/\* | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The module's unique ID. |

### Response {#get-response}

Returns a [module object]({{< relref "/operate/rs/references/rest-api/objects/module" >}}).

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Module does not exist. |

## Upload module v1 {#post-module}

```sh
POST /v1/modules
```

{{<note>}}
`POST /v1/modules` is deprecated as of Redis Enterprise Software version 7.2. Use [`POST /v2/modules`](#post-module-v2) instead.
{{</note>}}

Uploads a new module to the cluster.

The request must contain a Redis module, bundled using [RedisModule
Packer](https://github.com/RedisLabs/RAMP). For modules in Redis Stack, download the module from the [download center](https://redis.io/downloads/).

See [Install a module on a cluster]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster#rest-api-method" >}}) for more information.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) | admin |

### Request {#post-request}

#### Example HTTP request

```sh
POST /v1/modules
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | string | Domain name |
| Accept | \*/\* | Accepted media type |
| Content-Length | integer | Length of the request body in octets |
| Expect | 100-continue | Requires particular server behaviors |
| Content-Type | multipart/form-data | Media type of request/response body |

### Response {#post-response}

Returns a status code. If an error occurs, the response body may include an error code and message with more details.

#### Error codes {#post-error-codes}

The server may return a JSON object with `error_code` and `message` fields that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| no_module | Module wasn't provided or could not be found |
| invalid_module | Module either corrupted or packaged files are wrong |
| module_exists | Module already in system |
| min_redis_pack_version | Module isn't supported yet in this Redis pack |
| unsupported_module_capabilities | The module does not support required capabilities|
| os_not_supported | This module is not supported for this operating system |
| dependencies_not_supported | This endpoint does not support dependencies, see v2 |

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Either missing module file or an invalid module file. |

### Examples

#### cURL

```sh
$ curl -k -u "[username]:[password]" -X POST
       -F "module=@/tmp/rejson.Linux-ubuntu18.04-x86_64.2.0.8.zip"
       https://[host][:port]/v1/modules
```

#### Python

```python
import requests

url = "https://[host][:port]/v1/modules"

files=[
    ('module',
        ('rejson.Linux-ubuntu18.04-x86_64.2.0.8.zip',
        open('/tmp/rejson.Linux-ubuntu18.04-x86_64.2.0.8.zip','rb'),
        'application/zip')
    )
]
auth=("[username]", "[password]")

response = requests.request("POST", url,
                            auth=auth, files=files, verify=False)

print(response.text)
```

## Upload module v2 {#post-module-v2}

```sh
POST /v2/modules
```

Asynchronously uploads a new module to the cluster.

The request must contain a Redis module bundled using [RedisModule Packer](https://github.com/RedisLabs/RAMP).

For modules in Redis Stack, download the module from the [download center](https://redis.io/downloads/#software). See [Install a module on a cluster]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster#rest-api-method" >}}) for more information.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) | admin |

### Request {#post-request-v2}

#### Example HTTP request

```sh
POST /v2/modules
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | string| Domain name |
| Accept | \*/\* | Accepted media type |
| Content-Length | integer | Length of the request body in octets |
| Expect | 100-continue | Requires particular server behaviors |
| Content-Type | multipart/form-data; | Media type of request/response body |

### Response {#post-response-v2}

Returns a [module object]({{< relref "/operate/rs/references/rest-api/objects/module" >}}) with an additional `action_uid` field.

You can use the `action_uid` to track the progress of the module upload.

#### Example JSON body

```json
{
   "action_uid":"dfc0152c-8449-4b1c-9184-480ea7cb526c",
   "author":"RedisLabs",
   "capabilities":[
      "types",
      "crdb",
      "failover_migrate",
      "persistence_aof",
      "persistence_rdb",
      "clustering",
      "backup_restore"
   ],
   "command_line_args":"Plugin gears_python CreateVenv 1",
   "config_command":"RG.CONFIGSET",
   "dependencies":{
      "gears_jvm":{
         "sha256":"b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
         "url":"http://example.com/redisgears_plugins/jvm_plugin/gears-jvm.linux-centos7-x64.0.1.0.tgz"
      },
      "gears_python":{
         "sha256":"22dca9cd75484cb15b8130db37f5284e22e3759002154361f72f6d2db46ee682",
         "url":"http://example.com/redisgears-python.linux-centos7-x64.1.2.1.tgz"
      }
   },
   "description":"Dynamic execution framework for your Redis data",
   "display_name":"RedisGears",
   "email":"user@example.com",
   "homepage":"http://redisgears.io",
   "is_bundled":false,
   "license":"Redis Source Available License Agreement",
   "min_redis_pack_version":"6.0.0",
   "min_redis_version":"6.0.0",
   "module_name":"rg",
   "semantic_version":"1.2.1",
   "sha256":"2935ea53611803c8acf0015253c5ae1cd81391bbacb23e14598841e1edd8d28b",
   "uid":"98f255d5d33704c8e4e97897fd92e32d",
   "version":10201
}
```

### Error codes {#post-error-codes-v2}

The server may return a JSON object with `error_code` and `message` fields that provide additional information.

Possible `error_code` values include [`/v1/modules` error codes](#post-error-codes) and the following:

| Code | Description |
|------|-------------|
| invalid_dependency_data | Provided dependencies have an unexpected format |

### Status codes {#post-status-codes-v2}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, scheduled module upload. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Module name or version does not exist. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Dependency not found. |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Failed to get dependency. |

## Delete module v1 {#delete-module}

```sh
DELETE /v1/modules/{string: uid}
```

{{<note>}}
`DELETE /v1/modules` is deprecated as of Redis Enterprise Software version 7.2. Use [`DELETE /v2/modules`](#delete-module-v2) instead.
{{</note>}}

Delete a module.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) | admin |

### Request {#delete-request}

#### Example HTTP request

```sh
DELETE /v1/modules/1
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The module's unique ID. |

### Response {#delete-response}

Returns a status code to indicate module deletion success or failure.

#### Error codes {#delete-error-codes}

| Code | Description |
|------|-------------|
| dependencies_not_supported | You can use the following API endpoint to delete this module with its dependencies: [`/v2/modules/<uid>`](#delete-module-v2) |

#### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, the module is deleted. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to delete a nonexistent module. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | The request is not acceptable. |

## Delete module v2 {#delete-module-v2}

```sh
DELETE /v2/modules/{string: uid}
```

Delete a module.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) | admin |

### Request {#delete-request-v2}

#### Example HTTP request

```sh
DELETE /v2/modules/1
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The module's unique ID. |

### Response {#delete-response-v2}

Returns a JSON object with an `action_uid` that allows you to track the progress of module deletion.

#### Status codes {#delete-status-codes-v2}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, scheduled module deletion. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to delete a nonexistent module. |
