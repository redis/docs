---
Title: Auditing database connections requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Auditing database connections requests
headerRange: '[1-2]'
linkTitle: auditing/db_conns
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/cluster/auditing-db-conns/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-audit-db-conns) | `/v1/cluster/auditing/db_conns` | Get database connection auditing settings |
| [PUT](#put-cluster-audit-db-conns) | `/v1/cluster/auditing/db_conns` | Update database connection auditing settings |
| [DELETE](#delete-cluster-audit-db-conns) | `/v1/cluster/auditing/db_conns` | Delete database connection auditing settings |

## Get database auditing settings {#get-cluster-audit-db-conns}

	GET /v1/cluster/auditing/db_conns

Gets the configuration settings for [auditing database connections]({{< relref "/operate/rs/security/audit-events" >}}).

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster/auditing/db_conns 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns a [database connection auditing configuration object]({{< relref "/operate/rs/references/rest-api/objects/db-conns-auditing-config" >}}).

#### Example JSON body

```json
{
    "audit_address": "127.0.0.1",
    "audit_port": 12345,
    "audit_protocol": "TCP",
    "audit_reconnect_interval": 1,
    "audit_reconnect_max_attempts": 0
}
```

### Error codes {#get-error-codes} 

When errors are reported, the server may return a JSON object with `error_code` and `message` fields that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| db_conns_auditing_unsupported_by_capability | Not all nodes support DB Connections Auditing capability  | 

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Feature not supported for all nodes |

## Update database auditing {#put-cluster-audit-db-conns}

	PUT /v1/cluster/auditing/db_conns

Updates the configuration settings for [auditing database connections]({{< relref "/operate/rs/security/audit-events" >}}).

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#put-request} 

#### Example HTTP request

	PUT /v1/cluster/auditing/db_conns

#### Example JSON body

```json
{
    "audit_protocol": "TCP",
    "audit_address": "127.0.0.1",
    "audit_port": 12345,
    "audit_reconnect_interval": 1,
    "audit_reconnect_max_attempts": 0
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include a [database connection auditing configuration object]({{< relref "/operate/rs/references/rest-api/objects/db-conns-auditing-config" >}}) with updated fields in the request body.

### Response {#put-response} 

Returns the updated [database connection auditing configuration object]({{< relref "/operate/rs/references/rest-api/objects/db-conns-auditing-config" >}}).

#### Example JSON body

```json
{
    "audit_address": "127.0.0.1",
    "audit_port": 12345,
    "audit_protocol": "TCP",
    "audit_reconnect_interval": 1,
    "audit_reconnect_max_attempts": 0
}
```

### Error codes {#put-error-codes} 

When errors are reported, the server may return a JSON object with `error_code` and `message` fields that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| db_conns_auditing_unsupported_by_capability | Not all nodes support DB Connections Auditing capability  | 

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Feature not supported for all nodes |

## Delete database auditing settings {#delete-cluster-audit-db-conns}

	DELETE /v1/cluster/auditing/db_conns

Resets the configuration settings for [auditing database connections]({{< relref "/operate/rs/security/audit-events" >}}).

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#delete-request} 

#### Example HTTP request

	DELETE /v1/cluster/auditing/db_conns 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#delete-response} 

Returns a status code that indicates whether the database connection auditing settings reset successfully or failed to reset.

### Error codes {#delete-error-codes} 

When errors are reported, the server may return a JSON object with `error_code` and `message` fields that provide additional information. The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| db_conns_audit_config_not_found | Unable to find the auditing configuration |
| cannot_delete_audit_config_when_policy_enabled | Auditing cluster policy is 'enabled' when trying to delete the auditing configuration |
| cannot_delete_audit_config_when_bdb_enabled | One of the databases has auditing configuration 'enabled' when trying to delete the auditing configuration |

### Status codes {#delete-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Configuration not found |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Feature not supported for all nodes |
