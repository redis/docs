---
Title: User-defined module requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Custom, user-defined Redis module requests
headerRange: '[1-2]'
linkTitle: user-defined
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-local-user-defined-artifacts) | /v2/local/modules/user-defined/artifacts | List custom module artifacts on a node |
| [POST](#post-user-defined-module) | /v2/modules/user-defined | Create a custom module object in the CCS |
| [POST](#post-local-user-defined-artifacts) | /v2/local/modules/user-defined/artifacts | Upload a custom module artifact to a node |
| [DELETE](#delete-user-defined-module) | /v2/modules/user-defined/<uid> | Delete a custom module object from the CCS |
| [DELETE](#delete-local-user-defined-artifacts) | /v2/local/modules/user-defined/artifacts/<module_name>/<version> | Delete a custom module artifact from a node |

## List custom module artifacts {#get-local-user-defined-artifacts}

```sh
GET /v2/local/modules/user-defined/artifacts
```

Returns a list of all custom module artifacts on the local node.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_cluster_modules]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_modules" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-local-artifacts-request}

#### Example HTTP request

```sh
GET /v2/local/modules/user-defined/artifacts
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | \*/\* | Accepted media type |

### Response {#get-local-artifacts-response}

Returns a JSON array of custom module artifacts.

#### Example JSON body

```json
[
     {
         "module_name": "TestModule",
         "version": 123,
         "dependencies": [
             "dep_1",
             "dep_2"
         ]
     }
]
```

### Status codes {#get-local-artifacts-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, returns list of artifacts |

## Create custom module {#post-user-defined-module}

```sh
POST /v2/modules/user-defined
```

Creates a module object in the CCS. After calling this endpoint, you still need to upload the module's `.so` file to each node by calling [`POST /v2/local/modules/user-defined/artifacts`](#post-local-user-defined-artifacts) on each node.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [manage_cluster_modules]({{< relref "/operate/rs/references/rest-api/permissions#manage_cluster_modules" >}}) | admin |

### Request {#post-user-defined-request}

#### Example HTTP request

```sh
POST /v2/modules/user-defined
```

#### Example JSON body

```json
{
     "module_name": "TestModule",
     "version": 1,
     "semantic_version": "0.0.1",
     "display_name": "test module",
     "commands": [
         {
             "command_arity": -1,
             "command_name": "json.arrtrim",
             "first_key": 1,
             "flags": ["write"],
             "last_key": 1,
             "step": 1
         }
     ],
     "command_line_args": "",
     "capabilities": ["list", "of", "capabilities"],
     "min_redis_version": "2.1"
}
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

The request body is a JSON object that must contain the following fields:

| Field | Type | Description |
|-------|------|-------------|
| module_name | string | Name of the module |
| version | integer | Module version number |
| semantic_version | string | Module's semantic version |
| display_name | string | Display name for the module |
| commands | array of objects | List of commands provided by the module |
| command_line_args | string | Command line arguments for the module |
| capabilities | array of strings | List of capabilities supported by the module |
| min_redis_version | string | Minimum Redis version required |

### Response {#post-user-defined-response}

Returns a module metadata object.

#### Example JSON body

```json
{
    "author": "author name",
    "uid": "1952fcf9a5109fb59e61b1ad4d7e2d88"
    // additional fields...
}
```

### Status codes {#post-user-defined-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, the module was created in the CCS. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | There was an issue with the module object, such as missing required fields or invalid values. |

## Upload custom module artifact to a node {#post-local-user-defined-artifacts}

```sh
POST /v2/local/modules/user-defined/artifacts
```

A local API to upload a custom module's artifact to the current node. You must call this API on each cluster node.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [manage_cluster_modules]({{< relref "/operate/rs/references/rest-api/permissions#manage_cluster_modules" >}}) | admin |

### Request {#post-local-artifacts-request}

#### Example HTTP request

```sh
POST /v2/local/modules/user-defined/artifacts
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | 127.0.0.1:9443 | Domain name |
| Accept | \*/\* | Accepted media type |
| Content-Length | 865 | Length of the request body in octets |
| Expect | 100-continue | Requires particular server behaviors |
| Content-Type | multipart/form-data; boundary=------------------------4751ac3b332ace13 | Media type of request/response body |

### Response {#post-local-artifacts-response}

Returns a status code to indicate upload success or failure.

### Status codes {#post-local-artifacts-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, module artifact uploaded to local node |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Missing or bad artifact |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | There was an issue with the module object artifact, such as bad metadata |

## Delete custom module {#delete-user-defined-module}

```sh
DELETE /v2/modules/user-defined/{string: uid}
```

Delete a module object from the CCS. This REST API request does not delete the module artifact from the nodes, so you also need to call [`DELETE /v2/local/modules/user-defined/artifacts/<module_name>/<version>`](#delete-local-user-defined-artifacts) on each node.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [manage_cluster_modules]({{< relref "/operate/rs/references/rest-api/permissions#manage_cluster_modules" >}}) | admin |

### Request {#delete-user-defined-request}

#### Example HTTP request

```sh
DELETE /v2/modules/user-defined/1
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | string | The module's unique ID |

### Response {#delete-user-defined-response}

Returns a status code to indicate module deletion success or failure.

### Status codes {#delete-user-defined-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, the module is deleted. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Attempting to delete a non-existing module. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | The request is not acceptable. |


## Delete custom module artifact from a node{#delete-local-user-defined-artifacts}

```sh
DELETE /v2/local/modules/user-defined/artifacts/{string: module_name}/{int: version}
```

A local API to delete a custom module's artifact from the current node. You must call this API on each cluster node.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [manage_cluster_modules]({{< relref "/operate/rs/references/rest-api/permissions#manage_cluster_modules" >}}) | admin |

### Request {#delete-local-artifacts-request}

#### Example HTTP request

```sh
DELETE /v2/local/modules/user-defined/artifacts/some-custom-module/123
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| module_name | string | The name of the module artifact to delete |
| version | integer | The version of the module artifact to delete |

### Response {#delete-local-artifacts-response}

Returns a status code to indicate deletion success or failure.

### Status codes {#delete-local-artifacts-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, the module artifact is deleted from the local node. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Attempting to delete a non-existing module. |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | The request is not acceptable. |
