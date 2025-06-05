---
Title: Cluster LDAP requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: LDAP configuration requests
headerRange: '[1-2]'
linkTitle: ldap
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-ldap) | `/v1/cluster/ldap` | Get LDAP configuration |
| [PUT](#put-cluster-ldap) | `/v1/cluster/ldap` | Set/update LDAP configuration |
| [DELETE](#delete-cluster-ldap) | `/v1/cluster/ldap` | Delete LDAP configuration |

## Get LDAP configuration {#get-cluster-ldap}

	GET /v1/cluster/ldap

Get the LDAP configuration.

#### Required permissions

| Permission name |
|-----------------|
| [view_ldap_config]({{< relref "/operate/rs/references/rest-api/permissions#view_ldap_config" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster/ldap 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response} 

Returns an [LDAP object]({{< relref "/operate/rs/references/rest-api/objects/ldap" >}}).

#### Example JSON body

```json
{
   "bind_dn": "rl_admin",
   "bind_pass": "***",
   "ca_cert": "",
   "control_plane": false,
   "data_plane": false,
   "dn_group_attr": "MemberOf",
   "dn_group_query": {
      "base": "DC=windowsAD,DC=qa,DC=redislabs,DC=com",
      "filter": "member=%D",
      "scope": "subtree"
   },
   "starttls": false,
   "uris": ["ldap://ldap.example.org:636"],
   "user_dn_query": {
      "base": "DC=windowsAD,DC=qa,DC=redislabs,DC=com",
      "filter": "(&(objectClass=Person)(cn=%u))",
      "scope": "subtree"
   },
   "user_dn_template": "cn=%u, ou=users,dc=example,dc=org"
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success |

## Update LDAP configuration {#put-cluster-ldap}

	PUT /v1/cluster/ldap

Set or update the cluster LDAP configuration.

#### Required permissions

| Permission name |
|-----------------|
| [config_ldap]({{< relref "/operate/rs/references/rest-api/permissions#config_ldap" >}}) |

### Request {#put-request} 

#### Example HTTP request

	POST /v1/cluster/ldap 

#### Example JSON body

```json
{
    "uris": [
       "ldap://ldap.redislabs.com:389"
    ],
    "bind_dn": "rl_admin",
    "bind_pass": "secret",
    "user_dn_template": "cn=%u,dc=example,dc=org",
    "dn_group_attr": "MemberOf",
    "directory_timeout_s": 5
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Request body

Include an [LDAP object]({{< relref "/operate/rs/references/rest-api/objects/ldap" >}}) with updated fields in the request body.

### Response {#put-response} 

Returns a status code. If an error occurs, the response body may include an error code and message with more details.

### Error codes {#put-error-codes} 

Possible `error_code` values:

| Code | Description |
|------|-------------|
| illegal_fields_combination | An unacceptable combination of fields was specified for the configuration object (e.g.: two mutually-exclusive fields), or a required field is missing.| 

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, LDAP config has been set. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing configuration parameters. |

## Delete LDAP configuration {#delete-cluster-ldap}

	DELETE /v1/cluster/ldap

Clear the LDAP configuration.

#### Required permissions

| Permission name |
|-----------------|
| [config_ldap]({{< relref "/operate/rs/references/rest-api/permissions#config_ldap" >}}) |

### Request {#delete-request} 

#### Example HTTP request

	DELETE /v1/cluster/ldap 

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#delete-response} 

Returns a status code.

### Status codes {#delete-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success |
