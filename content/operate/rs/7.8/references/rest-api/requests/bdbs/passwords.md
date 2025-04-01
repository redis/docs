---
Title: Database passwords requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Database password requests
headerRange: '[1-2]'
linkTitle: passwords
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bdbs/passwords/'
---

| Method | Path | Description |
|--------|------|-------------|
| [PUT](#put-bdbs-password) | `/v1/bdbs/{uid}/passwords` | Update database password |
| [POST](#post-bdbs-password) | `/v1/bdbs/{uid}/passwords` | Add database password |
| [DELETE](#delete-bdbs-password) | `/v1/bdbs/{uid}/passwords` | Delete database password |

## Update database password {#put-bdbs-password}

	PUT /v1/bdbs/{int: uid}/passwords

Set a single password for the bdb's default user (i.e., for `AUTH`&nbsp;`<password>` authentications).

#### Required permissions

| Permission name |
|-----------------|
| [update_bdb]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb" >}}) |

### Request {#put-request} 

#### Example HTTP request

	PUT /v1/bdbs/1/passwords 

#### Example JSON body

```json
{
    "password": "new password"
}
```

The above request resets the password of the bdb to ‘new password’.

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to update the password. |


#### Request body

| Field | Type | Description |
|-------|------|-------------|
| password | string | New password |

### Response {#put-response} 

Returns a status code that indicates password update success or failure.

### Status codes {#put-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The password was changed. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | A nonexistent database. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Invalid configuration parameters provided. |

## Add database password {#post-bdbs-password}

	POST /v1/bdbs/{int: uid}/passwords

Add a password to the bdb's default user (i.e., for `AUTH`&nbsp;`<password>` authentications).

#### Required permissions

| Permission name |
|-----------------|
| [update_bdb]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb" >}}) |

### Request {#post-request} 

#### Example HTTP request

	POST /v1/bdbs/1/passwords 

#### Example JSON body

```json
{
    "password": "password to add"
}
```

The above request adds a password to the bdb.

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to add password. |

#### Request body

| Field | Type | Description |
|-------|------|-------------|
| password | string | Password to add |

### Response {#post-response} 

Returns a status code that indicates password creation success or failure.

### Status codes {#post-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The password was added. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | A nonexistent database. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Invalid configuration parameters provided. |

## Delete database password {#delete-bdbs-password}

	DELETE /v1/bdbs/{int: uid}/passwords

Delete a password from the bdb's default user (i.e., for `AUTH`&nbsp;`<password>` authentications).

#### Required permissions

| Permission name |
|-----------------|
| [update_bdb]({{< relref "/operate/rs/references/rest-api/permissions#update_bdb" >}}) |

### Request {#delete-request} 

#### Example HTTP request

	DELETE /v1/bdbs/1/passwords 

#### Example JSON body

```json
{
    "password": "password to delete"
}
```

The above request deletes a password from the bdb.

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database to delete password. |

#### Request body

| Field | Type | Description |
|-------|------|-------------|
| password | string | Password to delete |

### Response {#delete-response} 

Returns a status code that indicates password deletion success or failure.

### Status codes {#delete-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The password was deleted. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | A nonexistent database. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Invalid configuration parameters provided. |
