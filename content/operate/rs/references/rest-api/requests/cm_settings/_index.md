---
Title: Cluster Manager settings requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests for Cluster Manager UI settings
headerRange: '[1-2]'
hideListLinks: true
linkTitle: cm_settings
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cm-settings) | `/v1/cm_settings` | Get Cluster Manager UI settings |
| [PUT](#put-cm-settings) | `/v1/cm_settings` | Update Cluster Manager UI settings |

## Get CM settings {#get-cm-settings}

```sh
GET /v1/cm_settings
```

Get Cluster Manager UI settings.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#get-request}

#### Example HTTP request

```sh
GET /cm_settings
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response}

Returns a [cm_settings object]({{<relref "/operate/rs/references/rest-api/objects/cm_settings">}}).

#### Example JSON body

```json
{
    "timezone": "UTC"
}
```

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | No error |

## Update CM settings {#put-cm-settings}

```sh
PUT /v1/cm_settings
```

Update Cluster Manager UI settings.

### Permissions

| Permission name | Roles |
|-----------------|-------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) | admin |

### Request {#put-request}

#### Example HTTP request

```sh
PUT /cm_settings
```

#### Example JSON body

```json
{
    "timezone": "US/Pacific"
}
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Body

Include a [cm_settings object]({{<relref "/operate/rs/references/rest-api/objects/cm_settings">}}) with updated fields in the request body.

### Response {#put-response}

Returns a [cm_settings object]({{<relref "/operate/rs/references/rest-api/objects/cm_settings">}}) with the updated fields.

#### Example JSON body

```json
{
    "timezone": "US/Pacific"
}
```

#### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, time zone config has been set. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad or missing configuration parameters. |
