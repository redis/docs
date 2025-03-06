---
Title: Database availability requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to check database availability
headerRange: '[1-2]'
linkTitle: availability
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-db-endpoint-availability) | `/v1/local/bdbs/{uid}/endpoint/availability` | Verifies local database endpoint availability |
| [GET](#get-db-availability) | `/v1/bdbs/{uid}/availability` | Verifies database availability |

## Get database endpoint availability {#get-db-endpoint-availability}

```sh
GET /v1/local/bdbs/{uid}/endpoint/availability
```

Verifies the local database endpoint is available. This request does not redirect to the primary node.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_info]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-endpoint-request}

#### Example HTTP request

```sh
GET /v1/local/bdbs/1/endpoint/availability
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database. |

### Response {#get-endpoint-response}

Returns the status code `200 OK` if the local database endpoint is available.

If the local database endpoint is unavailable, returns an error status code and a JSON object that contains `error_code` and `description` fields.

### Error codes {#get-endpoint-error-codes}

When errors are reported, the server may return a JSON object with
`error_code` and `description` fields that provide additional information.
The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| no_quorum | Master healthcheck failed (no quorum in the cluster) |
| db_not_found | Database does not exist in the cluster |
| bdb_endpoint_unavailable | Local database endpoint is not available | 

### Status codes {#get-endpoint-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Database endpoint is available. |
| [503 Service Unavailable](https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable) | Database endpoint is unavailable. |


## Get database availability {#get-db-availability}

```sh
GET /v1/bdbs/{uid}/availability
```

Gets the availability status of a database.

- If the OSS Cluster API is enabled, verifies all endpoints for this database are available.

- Otherwise, verifies the database has at least one available endpoint.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_info]({{< relref "/operate/rs/references/rest-api/permissions#view_bdb_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |

### Request {#get-db-request}

#### Example HTTP request

```sh
GET /v1/bdbs/1/availability
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database. |

### Response {#get-db-response}

Returns the status code `200 OK` if the database is available.

If the database is unavailable, returns an error status code and a JSON object that contains `error_code` and `description` fields.

### Error codes {#get-db-error-codes}

When errors are reported, the server may return a JSON object with
`error_code` and `description` fields that provide additional information.
The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| no_quorum | Master healthcheck failed (no quorum in the cluster) |
| db_not_found | Database does not exist in the cluster |
| bdb_unavailable | Database is not available | 

### Status codes {#get-db-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Database is available. |
| [503 Service Unavailable](https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable) | Database is unavailable or doesn't have quorum. |
