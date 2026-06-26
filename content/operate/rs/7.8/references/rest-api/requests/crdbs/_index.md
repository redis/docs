---
Title: CRDBs requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Active-Active database requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: crdbs
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/crdbs/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-all-crdbs) | `/v1/crdbs` | Get all Active-Active databases |
| [GET](#get-crdb) | `/v1/crdbs/{crdb_guid}` | Get a specific Active-Active database |
| [PATCH](#patch-crdbs) | `/v1/crdbs/{crdb_guid}` | Update an Active-Active database |
| [POST](#post-crdb) | `/v1/crdbs` | Create a new Active-Active database |
| [DELETE](#delete-crdb) | `/v1/crdbs/{crdb_guid}` | Delete an Active-Active database |

## Get all Active-Active databases {#get-all-crdbs}

```sh
GET /v1/crdbs
```

Get a list of all Active-Active databases on the cluster.

### Request {#get-all-request}

#### Example HTTP request

```sh
GET /v1/crdbs
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| X-Task-ID | string | Specified task ID |
| X-Result-TTL | integer | Time (in seconds) to keep task result |

### Response {#get-all-response}

Returns a JSON array of [CRDB objects]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb" >}}).

##### Status codes {#get-all-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | A list of Active-Active database. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | Unauthorized request. Invalid credentials |

## Get an Active-Active database {#get-crdb}

```sh
GET /v1/crdbs/{crdb_guid}
```

Get a specific Active-Active database.

### Request {#get-request}

#### Example HTTP request

```sh
 GET /v1/crdbs/552bbccb-99f3-4142-bd17-93d245f0bc79
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| X-Task-ID | string | Specified task ID |
| X-Result-TTL | integer | Time (in seconds) to keep task result |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| crdb_guid | string | Globally unique Active-Active database ID (GUID) |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| instance_id | integer | Instance from which to get the Active-Active database information |

### Response {#get-response}

Returns a [CRDB object]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb" >}}).

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Active-Active database information is returned. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | Unauthorized request. Invalid credentials |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Database or configuration does not exist. |

## Update an Active-Active database {#patch-crdbs}

```sh
PATCH /v1/crdbs/{crdb_guid}
```

Update an Active-Active database's configuration.

In order to add or remove instances, use [<nobr>`POST crdbs/{crdb_guid}/updates`</nobr>]({{< relref "/operate/rs/7.8/references/rest-api/requests/crdbs/updates#post-crdbs-updates" >}}) instead.

### Request {#patch-request}

#### Example HTTP request

```sh
 PATCH /v1/crdbs/552bbccb-99f3-4142-bd17-93d245f0bc79
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| X-Task-ID | string | Specified task ID |
| X-Result-TTL | integer | Time (in seconds) to keep task result |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| crdb_guid | string | Globally unique Active-Active database ID (GUID) |

#### Request body

Include a [CRDB object]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb" >}}) with updated fields in the request body.

### Response {#patch-response}

Returns a [CRDB task object]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb_task" >}}).

#### Status codes {#patch-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The request has been accepted. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | The posted Active-Active database contains invalid parameters. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | Unauthorized request. Invalid credentials |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Configuration or Active-Active database not found. |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | The posted Active-Active database cannot be accepted. |

## Create an Active-Active database {#post-crdb}

```sh
POST /v1/crdbs
```

Create a new Active-Active database.

### Request {#post-request}

#### Example HTTP request

```sh
 POST /v1/crdbs
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| X-Task-ID | string | Specified task ID |
| X-Result-TTL | integer | Time (in seconds) to keep task result |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| dry_run | boolean | Validate the request without creating the database (optional) |

#### Request body

Include a [CRDB object]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb" >}}), which defines the Active-Active database, in the request body.

##### Example body

```json
{
    "default_db_config":
    {
        "name": "sample-crdb",
        "memory_size": 214748365
    },
    "instances":
    [
        {
            "cluster":
            {
                "url": "http://<cluster1_FQDN>:9443",
                "credentials":
                {
                    "username": "<username>",
                    "password": "<password>"
                },
                "name": "cluster-1"
            },
            "compression": 6
        },
        {
            "cluster":
            {
                "url": "http://<cluster2_FQDN>:9443",
                "credentials":
                {
                    "username": "<username>",
                    "password": "<password>"
                },
                "name": "cluster-2"
            },
            "compression": 6
        }
    ],
    "name": "sample-crdb"
}
```

This JSON body creates an Active-Active database without TLS and with two participating clusters.

### Response {#post-response}

Returns a [CRDB task object]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb_task" >}}).

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The request has been accepted. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | The request is invalid or malformed. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | Unauthorized request. Invalid credentials |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | The posted Active-Active database cannot be accepted. |

## Delete an Active-Active database {#delete-crdb}

```sh
DELETE /v1/crdbs/{crdb_guid}
```

Delete an Active-Active database.

### Request {#delete-request}

#### Example HTTP request

```sh
 DELETE /v1/crdbs/552bbccb-99f3-4142-bd17-93d245f0bc79
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| X-Task-ID | string | Specified task ID |
| X-Result-TTL | integer | Time (in seconds) to keep task result |

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| crdb_guid | string | Globally unique Active-Active database ID (GUID) |

### Response {#delete-response}

Returns a [CRDB task object]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb_task" >}}).

#### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Action was successful. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | Unauthorized request. Invalid credentials |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Configuration or Active-Active database not found. |
| [406&nbsp;Not&nbsp;Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | The Active-Active GUID is invalid or the Active-Active database was already deleted. |
