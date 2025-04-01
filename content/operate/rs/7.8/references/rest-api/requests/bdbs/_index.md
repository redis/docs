---
Title: Database requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Database requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: bdbs
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bdbs/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-bdbs) | `/v1/bdbs` | Get all databases |
| [GET](#get-bdbs) | `/v1/bdbs/{uid}` | Get a single database |
| [PUT](#put-bdbs) | `/v1/bdbs/{uid}` | Update database configuration |
| [PUT](#put-bdbs-action) | `/v1/bdbs/{uid}/{action}` | Update database configuration and perform additional action |
| [POST](#post-bdbs-v1) | `/v1/bdbs` | Create a new database |
| [POST](#post-bdbs-v2) | `/v2/bdbs` | Create a new database |
| [DELETE](#delete-bdbs) | `/v1/bdbs/{uid}` | Delete a database |

## Get all databases {#get-all-bdbs}

```sh
GET /v1/bdbs
```

Get all databases in the cluster.

### Permissions

| Permission name | Roles   |
|-----------------|---------|
| [view_all_bdbs_info]({{< relref "/operate/rs/references/rest-api/permissions#view_all_bdbs_info" >}}) |  admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-all-request}

#### Example HTTP request

```sh
GET /v1/bdbs?fields=uid,name
```

#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster |
| Accept | application/json |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| fields | string | Comma-separated list of field names to return (by default all fields are returned). (optional) |

### Response {#get-all-response}

The response body contains a JSON array with all databases, represented as [BDB objects]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}).

#### Body

```json
[
    {
        "uid": 1,
        "name": "name of database #1",
        "// additional fields..."
    },
    {
        "uid": 2,
        "name": "name of database #2",
        "// additional fields..."
    }
]
```

#### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

### Example requests

#### cURL

```sh
$ curl -k -X GET -u "[username]:[password]" \
       -H "accept: application/json" \
       https://[host][:port]/v1/bdbs?fields=uid,name
```

#### Python

```python
import requests
import json

url = "https://[host][:port]/v1/bdbs?fields=uid,name"
auth = ("[username]", "[password]")

headers = {
  'Content-Type': 'application/json'
}

response = requests.request("GET", url, auth=auth, headers=headers)

print(response.text)
```

## Get a database {#get-bdbs}

```sh
GET /v1/bdbs/{int: uid}
```

Get a single database.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_info]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bdbs/1
```

#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster |
| Accept | application/json |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database requested. |


#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| fields | string | Comma-separated list of field names to return (by default all fields are returned). (optional) |

### Response {#get-response}

Returns a [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}).

#### Example JSON body

```json
{
    "uid": 1,
    "name": "name of database #1",
    "// additional fields..."
}
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Database UID does not exist |

## Update database configuration {#put-bdbs}

```sh
PUT /v1/bdbs/{int: uid}
```
Update the configuration of an active database.

If called with the `dry_run` URL query string, the function will validate the [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) against the existing database, but will not invoke the state machine that will update it.

This is the basic version of the update request. See [Update database and perform action](#put-bdbs-action) to send an update request with an additional action.

To track this request's progress, poll the [`/actions/<action_uid>` endpoint]({{< relref "/operate/rs/references/rest-api/requests/bdbs/actions" >}}) with the action_uid returned in the response body.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_bdb]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb" >}}) | admin<br />cluster_member<br />db_member |

### Request {#put-request}

#### Example HTTP request

```sh
PUT /v1/bdbs/1
```

#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster |
| Accept | application/json |
| Content-type | application/json |

#### Query parameters

| Field   | Type | Description |
|---------|------|---------------|
| dry_run |      | Validate the new [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) but don't apply the update. |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database for which update is requested. |

#### Body

Include a [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) with updated fields in the request body.

##### Example JSON body

```json
{
    "replication": true,
    "data_persistence": "aof"
}
```

The above request attempts to modify a database configuration to enable in-memory data replication and append-only file data persistence.

### Response {#put-response}

Returns the updated [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}).

#### Example JSON body

```json
{
    "uid": 1,
    "replication": true,
    "data_persistence": "aof",
    "// additional fields..."
}
```

### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The request is accepted and is being processed. The database state will be 'active-change-pending' until the request has been fully processed. |
| [404&nbsp;Not&nbsp;Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to change a nonexistent database. |
| [406&nbsp;Not&nbsp;Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | The requested configuration is invalid. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Attempting to change a database while it is busy with another configuration change. In this context, this is a temporary condition, and the request should be reattempted later. |

#### Error codes {#put-error-codes}

When errors are reported, the server may return a JSON object with    `error_code` and `message` field that provide additional information.    The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| rack_awareness_violation | • Non rack-aware cluster.<br />• Not enough nodes in unique racks. |
| invalid_certificate | SSL client certificate is missing or malformed.|
| certificate_expired | SSL client certificate has expired. |
| duplicated_certs | An SSL client certificate appears more than once. |
| insufficient_resources | Shards count exceeds shards limit per bdb. |
| not_supported_action_on_crdt | `reset_admin_pass` action is not allowed on CRDT enabled BDB. |
| name_violation | CRDT database name cannot be changed. |
| bad_shards_blueprint | The sharding blueprint is broken or doesn’t fit the BDB. |
| replication_violation | CRDT database must use replication. |
| eviction_policy_violation | LFU eviction policy is not supported on bdb version<4 |
| replication_node_violation | Not enough nodes for replication. |
| replication_size_violation | Database limit too small for replication. |
| invalid_oss_cluster_configuration | BDB configuration does not meet the requirements for OSS cluster mode |
| missing_backup_interval | BDB backup is enabled but backup interval is missing. |
| crdt_sharding_violation | CRDB created without sharding cannot be changed to use sharding
| invalid_proxy_policy | Invalid proxy_policy value. |
| invalid_bdb_tags | Tag objects with the same key parameter were passed. |
| unsupported_module_capabilities | Not all modules configured for the database support the capabilities needed for the database configuration. |
| redis_acl_unsupported | Redis ACL is not supported for this database. |

## Update database and perform action {#put-bdbs-action}

```sh
PUT /v1/bdbs/{int: uid}/{action}
```
Update the configuration of an active database and perform an additional action.

If called with the `dry_run` URL query string, the function will validate the [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) against the existing database, but will not invoke the state machine that will update it.

#### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_bdb_with_action]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb_with_action" >}}) | admin<br />cluster_member<br />db_member |

### Request {#put-request-action}

#### Example HTTP request

```sh
PUT /v1/bdbs/1/reset_admin_pass
```
The above request resets the admin password after updating the database.

#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster |
| Accept | application/json |
| Content-type | application/json |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to update. |
| action | string | Additional action to perform. Currently supported actions are: `flush`, `reset_admin_pass`. |

#### Query parameters

| Field   | Type | Description |
|---------|------|---------------|
| dry_run |       | Validate the new [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) but don't apply the update. |

#### Body

Include a [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) with updated fields in the request body.

##### Example JSON body

```json
{
    "replication": true,
    "data_persistence": "aof"
}
```

The above request attempts to modify a database configuration to enable in-memory data replication and append-only file data persistence.

{{<note>}}
To change the shard hashing policy, you must flush all keys from the database.
{{</note>}}

### Response {#put-response-action}

If the request succeeds, the response body returns the updated [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}). If an error occurs, the response body may include an error code and message with more details.

#### Status codes {#put-status-codes-action}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The request is accepted and is being processed. The database state will be 'active-change-pending' until the request has been fully processed. |
| [403&nbsp;Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | redislabs license expired. |
| [404&nbsp;Not&nbsp;Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to change a nonexistent database. |
| [406&nbsp;Not&nbsp;Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | The requested configuration is invalid. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Attempting to change a database while it is busy with another configuration change. In this context, this is a temporary condition, and the request should be reattempted later. |

#### Error codes {#put-error-codes-action}

When errors are reported, the server may return a JSON object with    `error_code` and `message` field that provide additional information.    The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| rack_awareness_violation | • Non rack-aware cluster.<br />• Not enough nodes in unique racks. |
| invalid_certificate | SSL client certificate is missing or malformed.|
| certificate_expired | SSL client certificate has expired. |
| duplicated_certs | An SSL client certificate appears more than once. |
| insufficient_resources | Shards count exceeds shards limit per bdb. |
| not_supported_action_on_crdt | `reset_admin_pass` action is not allowed on CRDT enabled BDB. |
| name_violation | CRDT database name cannot be changed. |
| bad_shards_blueprint | The sharding blueprint is broken or doesn’t fit the BDB. |
| replication_violation | CRDT database must use replication. |
| eviction_policy_violation | LFU eviction policy is not supported on bdb version<4 |
| replication_node_violation | Not enough nodes for replication. |
| replication_size_violation | Database limit too small for replication. |
| invalid_oss_cluster_configuration | BDB configuration does not meet the requirements for OSS cluster mode |
| missing_backup_interval | BDB backup is enabled but backup interval is missing. |
| crdt_sharding_violation | CRDB created without sharding cannot be changed to use sharding
| invalid_proxy_policy | Invalid proxy_policy value. |
| invalid_bdb_tags | Tag objects with the same key parameter were passed. |
| unsupported_module_capabilities | Not all modules configured for the database support the capabilities needed for the database configuration. |
| redis_acl_unsupported | Redis ACL is not supported for this database. |

## Create database v1 {#post-bdbs-v1}

```sh
POST /v1/bdbs
```
Create a new database in the cluster.

The request must contain a single JSON [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) with the configuration parameters for the new database.

The following parameters are required to create the database:

| Parameter | Type/Value | Description |
|----------|------------|-------------|
| name     | string     | Name of the new database |
| memory_size | integer | Size of the database, in bytes |

If passed with the `dry_run` URL query string, the function will validate the [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}), but will not invoke the state machine that will create it.

To track this request's progress, poll the [`/actions/<action_uid>` endpoint]({{< relref "/operate/rs/references/rest-api/requests/bdbs/actions" >}}) with the `action_uid` returned in the response body.

The cluster will use default configuration for any missing database field. The cluster creates a database UID if it is missing.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [create_bdb]({{< relref "/operate/rs/references/rest-api/permissions#create_bdb" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request-v1}

#### Example HTTP request

```sh
POST /v1/bdbs
```

#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster |
| Accept | application/json |
| Content-type | application/json |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| dry_run |    | Validate the new [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) but don't create the database. |

#### Body

Include a [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) in the request body.

The following parameters are required to create the database:

| Paramter | Type/Value | Description |
|----------|------------|-------------|
| name     | string     | Name of the new database |
| memory_size | integer | Size of the database, in bytes |

The `uid` of the database is auto-assigned by the cluster because it was not explicitly listed in this request. If you specify the database ID (`uid`), then you must specify the database ID for every subsequent database and make sure that the database ID does not conflict with an existing database. If you do not specify the database ID, then the it is automatically assigned in sequential order.

Defaults are used for all other configuration parameters.

#### Example JSON body

```json
{
    "name": "test-database",
    "type": "redis",
    "memory_size": 1073741824
}
```

The above request is an attempt to create a Redis database with a user-specified name and a memory limit of 1GB.

### Response {#post-response-v1}

The response includes the newly created [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}).

#### Example JSON body

```json
{
    "uid": 1,
    "name": "test-database",
    "type": "redis",
    "memory_size": 1073741824,
    "// additional fields..."
}
```

#### Error codes {#post-error-codes-v1}

When errors are reported, the server may return a JSON object with `error_code` and `message` field that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| uid_exists | The specified database UID is already in use. |
| missing_db_name | DB name is a required property. |
| missing_memory_size | Memory Size is a required property. |
| missing_module | Modules missing from the cluster. |
| port_unavailable | The specified database port is reserved or already in use. |
| invalid_sharding | Invalid sharding configuration was specified. |
| bad_shards_blueprint | The sharding blueprint is broken. |
| not_rack_aware | Cluster is not rack-aware and a rack-aware database was requested. |
| invalid_version | An invalid database version was requested. |
| busy | The request failed because another request is being processed at the same time on the same database. |
| invalid_data_persistence | Invalid data persistence configuration. |
| invalid_proxy_policy | Invalid proxy_policy value. |
| invalid_sasl_credentials | SASL credentials are missing or invalid. |
| invalid_replication | Not enough nodes to perform replication. |
| insufficient_resources | Not enough resources in cluster to host the database. |
| rack_awareness_violation | • Rack awareness violation.<br/>• Not enough nodes in unique racks. |
| invalid_certificate | SSL client certificate is missing or malformed. |
| certificate_expired | SSL client certificate has expired. |
| duplicated_certs | An SSL client certificate appears more than once. |
| replication_violation | CRDT database must use replication. |
| eviction_policy_violation | LFU eviction policy is not supported on bdb version<4 |
| invalid_oss_cluster_configuration | BDB configuration does not meet the requirements for OSS cluster mode |
| memcached_cannot_use_modules | Cannot create a memcached database with modules. |
| missing_backup_interval | BDB backup is enabled but backup interval is missing. |
| wrong_cluster_state_id | The given CLUSTER-STATE-ID does not match the current one
| invalid_bdb_tags | Tag objects with the same key parameter were passed. |
| unsupported_module_capabilities | Not all modules configured for the database support the capabilities needed for the database configuration. |
| redis_acl_unsupported | Redis ACL is not supported for this database. |

#### Status codes {#post-status-codes-v1}

| Code | Description |
|------|-------------|
| [403 Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | redislabs license expired. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Database with the same UID already exists. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Invalid configuration parameters provided. |
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, database is being created. |

## Create database v2 {#post-bdbs-v2}

```sh
POST /v2/bdbs
```
Create a new database in the cluster. See [`POST /v1/bdbs`]({{< relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v1" >}}) for more information.

The database's configuration should be under the "bdb" field.

This endpoint allows you to specify a recovery_plan to recover a database. If you include a recovery_plan within the request body, the database will be loaded from the persistence files according to the recovery plan. The recovery plan must match the number of shards requested for the database.

The persistence files must exist in the locations specified by the recovery plan. The persistence files must belong to a database with the same shard settings as the one being created (slot range distribution and shard_key_regex); otherwise, the operation will fail or yield unpredictable results.

If you create a database with a shards_blueprint and a recovery plan, the shard placement may not fully follow the shards_blueprint.

### Request {#post-request-v2}

#### Example HTTP request

```sh
POST /v2/bdbs
```

#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster |
| Accept | application/json |
| Content-type | application/json |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| dry_run |    | Validate the new [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) but don't create the database. |

#### Body

Include a JSON object that contains a [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) and an optional `recovery_plan` object in the request body.

##### Example JSON body

```json
{
    "bdb": {
        "name": "test-database",
        "type": "redis",
        "memory_size": 1073741824,
        "shards_count": 1
    },
    "recovery_plan": {
        "data_files": [
            {
                "shard_slots": "0-16383",
                "node_uid": "1",
                "filename": "redis-4.rdb"
            }
        ]
    }
}
```

### Response {#post-response-v2}

The response includes the newly created [BDB object]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}).

#### Example JSON body

```json
{
    "uid": 1,
    "name": "test-database",
    "type": "redis",
    "memory_size": 1073741824,
    "shards_count": 1,
    "// additional fields..."
}
```

## Delete database {#delete-bdbs}

```sh
DELETE /v1/bdbs/{int: uid}
```
Delete an active database.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [delete_bdb]({{< relref "/operate/rs/references/rest-api/permissions#delete_bdb" >}}) | admin<br />cluster_member<br />db_member |

### Request {#delete-request}

#### Example HTTP request

```sh
DELETE /v1/bdbs/1
```
#### Headers

| Key | Value |
|-----|-------|
| Host | The domain name or IP of the cluster |
| Accept | application/json |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to delete. |

### Response {#delete-response}

Returns a status code that indicates the database deletion success or failure.

### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The request is accepted and is being processed. The database state will be 'delete-pending' until the request has been fully processed. |
| [403 Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | Attempting to delete an internal database. |
| [404&nbsp;Not&nbsp;Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to delete a nonexistent database. |
| [409 Conflict](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.10) | Either the database is not in 'active' state and cannot be deleted, or it is busy with another configuration change. In the second case, this is a temporary condition, and the request should be re-attempted later. |
