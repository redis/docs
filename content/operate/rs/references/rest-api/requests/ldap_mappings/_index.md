---
Title: LDAP mappings requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: LDAP mappings requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: ldap_mappings
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-ldap_mappings) | `/v1/ldap_mappings` | Get all LDAP mappings |
| [GET](#get-ldap_mapping) | `/v1/ldap_mappings/{uid}` | Get a single LDAP mapping |
| [PUT](#put-ldap_mapping) | `/v1/ldap_mappings/{uid}` | Update an LDAP mapping |
| [POST](#post-ldap_mappings) | `/v1/ldap_mappings` | Create a new LDAP mapping |
| [DELETE](#delete-ldap_mappings) | `/v1/ldap_mappings/{uid}` | Delete an LDAP mapping |

## Get all LDAP mappings {#get-all-ldap_mappings}

	GET /v1/ldap_mappings

Get all LDAP mappings.

#### Required permissions

| Permission name |
|-----------------|
| [view_all_ldap_mappings_info]({{< relref "/operate/rs/references/rest-api/permissions#view_all_ldap_mappings_info" >}}) |

### Request {#get-all-request} 

#### Example HTTP request

	GET /v1/ldap_mappings 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-all-response} 

Returns a JSON array of [LDAP mapping objects]({{< relref "/operate/rs/references/rest-api/objects/ldap_mapping" >}}).

#### Example JSON body

```json
[
  {
     "uid": 17,
     "name": "Admins",
     "dn": "OU=ops.group,DC=redislabs,DC=com",
     "email": "ops.group@redislabs.com",
     "role_uids": ["1"],
     "email_alerts": true,
     "bdbs_email_alerts": ["1","2"],
     "cluster_email_alerts": true
  }
]
```

### Status codes {#get-all-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

## Get LDAP mapping {#get-ldap_mapping}

	GET /v1/ldap_mappings/{int: uid}

Get a specific LDAP mapping.

#### Required permissions

| Permission name |
|-----------------|
| [view_ldap_mapping_info]({{< relref "/operate/rs/references/rest-api/permissions#view_ldap_mapping_info" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/ldap_mappings/1 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The object's unique ID. |

### Response {#get-response} 

Returns an [LDAP mapping object]({{< relref "/operate/rs/references/rest-api/objects/ldap_mapping" >}}).

#### Example JSON body

```json
{
     "uid": 17,
     "name": "Admins",
     "dn": "OU=ops.group,DC=redislabs,DC=com",
     "email": "ops.group@redislabs.com",
     "role_uids": ["1"],
     "email_alerts": true,
     "bdbs_email_alerts": ["1","2"],
     "cluster_email_alerts": true
}
```

### Error codes {#get-error-codes} 

Possible `error_code` values:

| Code | Description |
|------|-------------|
| unsupported_resource | The cluster is not yet able to handle this resource type. This could happen in a partially upgraded cluster, where some of the nodes are still on a previous version.| 
| ldap_mapping_not_exist | An object does not exist| 

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success. |
| [403 Forbidden](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4) | Operation is forbidden. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | ldap_mapping does not exist. |
| [501 Not Implemented](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.2) | Cluster doesn't support LDAP mappings yet. |

## Update LDAP mapping {#put-ldap_mapping}

	PUT /v1/ldap_mappings/{int: uid}

Update an existing ldap_mapping object.

#### Required permissions

| Permission name |
|-----------------|
| [update_ldap_mapping]({{< relref "/operate/rs/references/rest-api/permissions#update_ldap_mapping" >}}) |

### Request {#put-request} 

#### Example HTTP request

	PUT /v1/ldap_mappings/17 

#### Example JSON body

```json
{
    "dn": "OU=ops,DC=redislabs,DC=com",
    "email": "ops@redislabs.com",
    "email_alerts": true,
    "bdbs_email_alerts": ["1","2"],
    "cluster_email_alerts": true
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Request body

Include an [LDAP mapping object]({{< relref "/operate/rs/references/rest-api/objects/ldap_mapping" >}}) with updated fields in the request body.

### Response {#put-response} 

#### Example JSON body

```json
{
     "uid": 17,
     "name": "Admins",
     "dn": "OU=ops,DC=redislabs,DC=com",
     "email": "ops@redislabs.com",
     "role_uids": ["1"],
     "email_alerts": true,
     "bdbs_email_alerts": ["1","2"],
     "cluster_email_alerts": true
}
```

### Error codes {#put-error-codes} 

Possible `error_code` values:

| Code | Description |
|------|-------------|
| unsupported_resource | The cluster is not yet able to handle this resource type. This could happen in a partially upgraded cluster, where some of the nodes are still on a previous version.| 
| name_already_exists | An object of the same type and name exists| 
| ldap_mapping_not_exist | An object does not exist| 
| invalid_dn_param | A dn parameter has an illegal value| 
| invalid_name_param | A name parameter has an illegal value| 
| invalid_role_uids_param | A role_uids parameter has an illegal value| 
| invalid_account_id_param | An account_id parameter has an illegal value| 

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, LDAP mapping is created. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing configuration parameters. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to change a non-existing LDAP mapping. |
| [501 Not Implemented](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.2) | Cluster doesn't support LDAP mapping yet. |

## Create LDAP mapping {#post-ldap_mappings}

	POST /v1/ldap_mappings

Create a new LDAP mapping.

#### Required permissions

| Permission name |
|-----------------|
| [create_ldap_mapping]({{< relref "/operate/rs/references/rest-api/permissions#create_ldap_mapping" >}}) |

### Request {#post-request} 

#### Example HTTP request

	POST /v1/ldap_mappings 

#### Example JSON body

```json
{
     "name": "Admins",
     "dn": "OU=ops.group,DC=redislabs,DC=com",
     "email": "ops.group@redislabs.com",
     "role_uids": ["1"]
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Request body

Include an [LDAP mapping object]({{< relref "/operate/rs/references/rest-api/objects/ldap_mapping" >}}) in the request body.

### Response {#post-response} 

#### Example JSON body

```json
{
     "uid": 17,
     "name": "Admins",
     "dn": "OU=ops.group,DC=redislabs,DC=com",
     "email": "ops.group@redislabs.com",
     "role_uids": ["1"]
}
```

### Error codes {#post-error-codes} 

Possible `error_code` values:

| Code | Description |
|------|-------------|
| unsupported_resource | The cluster is not yet able to handle this resource type. This could happen in a partially upgraded cluster, where some of the nodes are still on a previous version.| 
| name_already_exists | An object of the same type and name exists| 
| missing_field | A needed field is missing| 
| invalid_dn_param | A dn parameter has an illegal value| 
| invalid_name_param | A name parameter has an illegal value| 
| invalid_role_uids_param | A role_uids parameter has an illegal value| 

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, an LDAP-mapping object is created. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing configuration parameters. |
| [501 Not Implemented](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.2) | Cluster doesn't support LDAP mappings yet. |

## Delete LDAP mapping {#delete-ldap_mappings}

	DELETE /v1/ldap_mappings/{int: uid}

Delete an LDAP mapping object.

#### Required permissions

| Permission name |
|-----------------|
| [delete_ldap_mapping]({{< relref "/operate/rs/references/rest-api/permissions#delete_ldap_mapping" >}}) |

### Request {#delete-request} 

#### Example HTTP request

	DELETE /v1/ldap_mappings/1 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The ldap_mapping unique ID. |

### Response {#delete-response} 

Returns a status code. If an error occurs, the response body may include a more specific error code and message.

### Error codes {#delete-error-codes} 

Possible `error_code` values:

| Code | Description |
|------|-------------|
| unsupported_resource | The cluster is not yet able to handle this resource type. This could happen in a partially upgraded cluster, where some of the nodes are still on a previous version.| 
| ldap_mapping_not_exist | An object does not exist| 

### Status codes {#delete-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, the ldap_mapping is deleted. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | The request is not acceptable. |
| [501 Not Implemented](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.2) | Cluster doesn't support LDAP mappings yet. |
